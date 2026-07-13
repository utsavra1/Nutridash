import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../errors';

interface ErrorResponseBody {
  code: ErrorCode;
  message: string;
  statusCode: number;
  path: string;
  timestamp: string;
}

interface NestErrorShape {
  code?: ErrorCode;
  message?: string;
}

function isNestErrorShape(value: unknown): value is NestErrorShape {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;
    let message = 'Something went wrong. Please try again.';

    if (exception instanceof HttpException) {
      const res: unknown = exception.getResponse();
      statusCode = exception.getStatus();

      if (isNestErrorShape(res) && res.code) {
        code = res.code;
        message = res.message ?? exception.message;
      } else {
        const mappedCode = mapStatusToErrorCode(statusCode);
        if (mappedCode) code = mappedCode;
        message = exception.message;
      }
    } else {
      this.logger.error(
        `Unhandled exception at ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      code,
      message,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}

function mapStatusToErrorCode(statusCode: number): ErrorCode | undefined {
  switch (statusCode) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    default:
      return undefined;
  }
}
