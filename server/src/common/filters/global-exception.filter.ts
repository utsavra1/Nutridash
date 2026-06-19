import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorHttpStatus } from '../errors';

interface ErrorResponseBody {
  code: ErrorCode;
  message: string;
  statusCode: number;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again.';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      statusCode = exception.getStatus();

      // If the exception body already carries our own `code`, trust it
      if (typeof res === 'object' && res !== null && 'code' in res) {
        code = (res as any).code;
        message = (res as any).message ?? exception.message;
      } else {
        // Fallback: map raw Nest exceptions (e.g. ValidationPipe) to our codes
        if (statusCode === HttpStatus.BAD_REQUEST) {
          code = ErrorCode.VALIDATION_ERROR;
        } else if (statusCode === HttpStatus.UNAUTHORIZED) {
          code = ErrorCode.UNAUTHORIZED;
        } else if (statusCode === HttpStatus.FORBIDDEN) {
          code = ErrorCode.FORBIDDEN;
        } else if (statusCode === HttpStatus.NOT_FOUND) {
          code = ErrorCode.NOT_FOUND;
        }
        message = exception.message;
      }
    } else {
      // Unexpected, non-HTTP error — log full details, never expose internals
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