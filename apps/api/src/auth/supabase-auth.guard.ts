import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { SupabaseJwtService } from './supabase-jwt.service';

const DEV_HEADER_NAMES = {
  userId: 'x-dev-user-id',
  businessId: 'x-dev-business-id',
  branchId: 'x-dev-branch-id',
  registerId: 'x-dev-register-id',
} as const;

type AuthenticatedRequest = Request & {
  headers: Record<string, string | string[] | undefined>;
  user?: RequestUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly supabaseJwtService: SupabaseJwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (typeof authorizationHeader === 'string') {
      const [scheme, token] = authorizationHeader.split(' ');

      if (scheme?.toLowerCase() === 'bearer' && token) {
        request.user = await this.supabaseJwtService.verifyAccessToken(token);
        return true;
      }
    }

    if (this.configService.get<string>('ALLOW_DEV_AUTH_BYPASS') === 'true') {
      const userId = request.headers[DEV_HEADER_NAMES.userId];
      const businessId = request.headers[DEV_HEADER_NAMES.businessId];
      const branchId = request.headers[DEV_HEADER_NAMES.branchId];
      const registerId = request.headers[DEV_HEADER_NAMES.registerId];

      if (typeof userId === 'string' && userId.length > 0) {
        request.user = {
          id: userId,
          businessId: typeof businessId === 'string' ? businessId : null,
          branchId: typeof branchId === 'string' ? branchId : null,
          registerId: typeof registerId === 'string' ? registerId : null,
        };

        return true;
      }
    }

    throw new UnauthorizedException(
      'Se requiere un token valido de Supabase o bypass de desarrollo configurado.',
    );
  }
}
