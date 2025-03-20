import {Request, Response, NextFunction} from 'express';
import {HttpError} from '../application/HttpError';
import {logger} from './logger';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let details: unknown = null;

  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    errorMessage = error.message;
    details = error.details;
  }

  // Do not log expected client errors.
  if (statusCode >= 500) {
    const logErrorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as {message: string}).message
        : 'Internal Server Error';

    logger.error('API Error:', {
      statusCode,
      errorMessage: logErrorMessage,
      details,
      stack:
        typeof error === 'object' && error !== null && 'stack' in error
          ? (error as {stack?: string}).stack
          : undefined,
    });
  }

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal Server Error' : errorMessage,
    // Include details only if it’s not a 500 error and they exist.
    ...(statusCode < 500 && details ? {details} : {}),
  });
};
