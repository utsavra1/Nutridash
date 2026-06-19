/**
 * Single source of truth for all API error codes.
 * Every error response includes one of these `code` values.
 * Frontend switches on `error.response.data.code` — never on HTTP status alone.
 */

export enum ErrorCode {
  ONBOARDING_INCOMPLETE = 'ONBOARDING_INCOMPLETE',
  ITEM_UNAVAILABLE = 'ITEM_UNAVAILABLE',
  STRIPE_PAYMENT_FAILED = 'STRIPE_PAYMENT_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.ONBOARDING_INCOMPLETE]: 403,
  [ErrorCode.ITEM_UNAVAILABLE]: 400,
  [ErrorCode.STRIPE_PAYMENT_FAILED]: 402,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ACCOUNT_SUSPENDED]: 403,
  [ErrorCode.INTERNAL_ERROR]: 500,
};