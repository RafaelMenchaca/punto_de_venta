import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { buildValidationException } from './common/validation/validation-errors';
import { AppModule } from './app.module';

type RequestWithContext = Request & {
  requestId?: string;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestWithContext = request as RequestWithContext;
    const headerValue = request.headers['x-request-id'];
    const requestId =
      typeof headerValue === 'string' && headerValue.trim().length > 0
        ? headerValue.trim()
        : randomUUID();

    requestWithContext.requestId = requestId;
    response.setHeader('x-request-id', requestId);
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

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
