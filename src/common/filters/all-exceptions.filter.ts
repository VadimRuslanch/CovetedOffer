import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const request: Request = host.switchToHttp().getRequest<Request>();
    const response: Response = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let message: string | string[] = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const details = exception.getResponse();
      if (
        typeof details === 'object' &&
        details !== null &&
        'message' in details &&
        (typeof details.message === 'string' || Array.isArray(details.message))
      ) {
        message = details.message;
      } else {
        message = exception.message;
      }
    }

    if (
      exception instanceof Error &&
      'code' in exception &&
      exception.code === '23505'
    ) {
      status = 409;
      message = 'Нарушено ограничение уникальности';
    }

    const error = {
      statusCode: status || 500,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status === 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;

      this.logger.error(
        `Unexpected error: ${request.method} ${request.path}`,
        stack,
      );
    }

    response.status(status).json(error);
  }
}
