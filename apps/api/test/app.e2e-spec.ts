import { randomUUID } from 'node:crypto';
import {
  CanActivate,
  ForbiddenException,
  INestApplication,
  Injectable,
  type ExecutionContext,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { buildValidationException } from '../src/common/validation/validation-errors';
import { CashController } from '../src/modules/cash/cash.controller';
import { CashService } from '../src/modules/cash/cash.service';
import { ContextController } from '../src/modules/context/context.controller';
import { ContextService } from '../src/modules/context/context.service';

type MockContextService = Pick<
  ContextService,
  'getOperatingContext' | 'getBusinesses' | 'getBranches' | 'getRegisters'
>;

type MockCashService = Pick<
  CashService,
  | 'getOpenCashSessionByRegister'
  | 'openCashSession'
  | 'getCashSessionSummary'
  | 'getCashSessionMovements'
  | 'createCashMovement'
  | 'listCashSessions'
  | 'closeCashSession'
>;

type RequestWithContext = Request & {
  requestId?: string;
  user?: {
    id: string;
    businessId?: string | null;
    branchId?: string | null;
    registerId?: string | null;
  };
};

type ApiErrorResponse = {
  message: string;
  path: string;
  requestId: string;
  errorCode?: string;
  errors?: Array<{
    field: string;
    messages: string[];
  }>;
};

@Injectable()
class DevBypassAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const userId = request.headers['x-dev-user-id'];

    if (typeof userId === 'string' && userId.length > 0) {
      request.user = {
        id: userId,
      };
      return true;
    }

    throw new UnauthorizedException(
      'Se requiere un token valido de Supabase o bypass de desarrollo configurado.',
    );
  }
}

describe('API hardening (e2e)', () => {
  let app: INestApplication<App>;
  let contextService: jest.Mocked<MockContextService>;
  let cashService: jest.Mocked<MockCashService>;

  beforeEach(async () => {
    contextService = {
      getOperatingContext: jest.fn().mockResolvedValue({ ok: true }),
      getBusinesses: jest.fn().mockResolvedValue([]),
      getBranches: jest.fn().mockResolvedValue([]),
      getRegisters: jest.fn().mockResolvedValue([]),
    };

    cashService = {
      getOpenCashSessionByRegister: jest.fn(),
      openCashSession: jest.fn().mockResolvedValue({ id: randomUUID() }),
      getCashSessionSummary: jest.fn(),
      getCashSessionMovements: jest.fn(),
      createCashMovement: jest.fn(),
      listCashSessions: jest.fn(),
      closeCashSession: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContextController, CashController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: DevBypassAuthGuard,
        },
        {
          provide: ContextService,
          useValue: contextService,
        },
        {
          provide: CashService,
          useValue: cashService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use((req: Request, res: Response, next: NextFunction) => {
      const request = req as RequestWithContext;
      const headerValue = req.headers['x-request-id'];
      const requestId =
        typeof headerValue === 'string' && headerValue.trim().length > 0
          ? headerValue.trim()
          : randomUUID();

      res.setHeader('x-request-id', requestId);
      request.requestId = requestId;
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: buildValidationException,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rechaza requests protegidos sin autenticacion con un 401 consistente', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/context/operating')
      .expect(401);
    const body = response.body as ApiErrorResponse;

    expect(body.message).toBe(
      'Se requiere un token valido de Supabase o bypass de desarrollo configurado.',
    );
    expect(body.path).toBe('/api/context/operating');
    expect(typeof body.requestId).toBe('string');
  });

  it('permite el bypass de desarrollo y entrega el usuario al controlador', async () => {
    await request(app.getHttpServer())
      .get('/api/context/operating')
      .set('x-dev-user-id', randomUUID())
      .expect(200);

    const operatingContextCalls = contextService.getOperatingContext.mock
      .calls as Array<[Record<string, never>, { id: string }]>;

    expect(operatingContextCalls).toHaveLength(1);
    expect(operatingContextCalls[0]?.[0]).toEqual({});
    expect(typeof operatingContextCalls[0]?.[1].id).toBe('string');
  });

  it('normaliza errores de validacion sin devolver mensajes tecnicos crudos', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/cash/sessions/open')
      .set('x-dev-user-id', randomUUID())
      .send({
        business_id: randomUUID(),
        branch_id: randomUUID(),
        register_id: randomUUID(),
        opening_amount: 100,
        unexpected_field: true,
      })
      .expect(400);
    const body = response.body as ApiErrorResponse;

    expect(body.message).toBe('Los datos enviados no son validos.');
    expect(body.errorCode).toBe('VALIDATION_ERROR');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'unexpected_field',
          messages: ['Campo no permitido.'],
        }),
      ]),
    );
  });

  it('mantiene respuestas 403 consistentes cuando una accion es bloqueada', async () => {
    cashService.openCashSession.mockRejectedValueOnce(
      new ForbiddenException('No tienes permiso para operar caja.'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/cash/sessions/open')
      .set('x-dev-user-id', randomUUID())
      .send({
        business_id: randomUUID(),
        branch_id: randomUUID(),
        register_id: randomUUID(),
        opening_amount: 250,
      })
      .expect(403);
    const body = response.body as ApiErrorResponse;

    expect(body.message).toBe('No tienes permiso para operar caja.');
    expect(body.path).toBe('/api/cash/sessions/open');
    expect(typeof body.requestId).toBe('string');
  });
});
