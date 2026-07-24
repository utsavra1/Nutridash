import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../errors';

interface ErrorResponseBody {
  code: ErrorCode;
  message: string;
  statusCode: number;
  path: string;
  timestamp: string;
  errors?: any;
}

interface NestErrorShape {
  code?: string;
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function isNestErrorShape(value: unknown): value is NestErrorShape {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    console.log('🐛 GlobalExceptionFilter caught exception:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    console.log('📥 Request body:', request.body);

    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;
    let message = 'Something went wrong. Please try again.';
    let errors: any;

    if (exception instanceof HttpException) {
      const res: unknown = exception.getResponse();
      statusCode = exception.getStatus();

      if (isNestErrorShape(res)) {
        if (res.code) {
          code = res.code as ErrorCode;
          message = Array.isArray(res.message) 
            ? res.message.join(', ') 
            : (res.message ?? exception.message);
        } else {
          const mappedCode = mapStatusToErrorCode(statusCode);
          if (mappedCode) code = mappedCode;
          
          if (exception instanceof BadRequestException && isNestErrorShape(res)) {
            message = Array.isArray(res.message) 
              ? res.message.join(', ') 
              : (res.message ?? 'Validation failed');
            errors = res.message;
          } else {
            message = exception.message;
          }
        }
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
      ...(errors && { errors }),
    };

    console.log('📤 Sending error response:', body);
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
