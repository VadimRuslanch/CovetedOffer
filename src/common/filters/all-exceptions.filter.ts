import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const request: Request = host.switchToHttp().getRequest();
    const response: Response = host.switchToHttp().getResponse();
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

    response.status(status).json(error);
  }
}
