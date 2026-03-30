import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type RequestWithContext = Request & {
  requestId?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private getDefaultMessage(status: number) {
    switch (status) {
      case 400:
        return 'Los datos enviados no son validos.';
      case 401:
        return 'Tu sesion ya no es valida. Inicia sesion nuevamente.';
      case 403:
        return 'No tienes permiso para realizar esta accion.';
      case 404:
        return 'No se encontro la informacion solicitada.';
      case 409:
        return 'La operacion no se puede completar por un conflicto de datos.';
      default:
        return 'No se pudo completar la solicitud en este momento.';
    }
  }

  private normalizeHttpExceptionPayload(
    status: number,
    exceptionResponse: string | object,
  ) {
    const basePayload =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown>);
    const rawMessage = basePayload.message;
    const errors = Array.isArray(basePayload.errors)
      ? basePayload.errors
      : Array.isArray(rawMessage)
        ? rawMessage
        : undefined;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : this.getDefaultMessage(status);

    return {
      message,
      errorCode:
        typeof basePayload.errorCode === 'string'
          ? basePayload.errorCode
          : undefined,
      errors,
    };
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithContext>();
    const requestId = request.requestId ?? 'unknown-request';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const payload = this.normalizeHttpExceptionPayload(
        status,
        exceptionResponse,
      );

      if (status === 401 || status === 403) {
        this.logger.warn(
          `[${requestId}] ${request.method} ${request.url} -> ${status} ${payload.message}`,
        );
      }

      response.status(status).json({
        statusCode: status,
        message: payload.message,
        errorCode: payload.errorCode,
        errors: payload.errors,
        path: request.url,
        requestId,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    this.logger.error(
      `[${requestId}] Unexpected error on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'No se pudo completar la solicitud en este momento.',
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
