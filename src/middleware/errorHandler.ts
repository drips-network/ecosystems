import {Request, Response, NextFunction} from 'express';
import {HttpError, ValidationError} from '../errors/HttpError';
import {logger} from '../logger/logger';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    logger.warn(`${error.message} (status: ${error.statusCode})`);

    res.status(error.statusCode).json({message: error.message});
  } else if (error instanceof ValidationError) {
    logger.warn(`Validation error: ${error.message}`);

    res.status(400).json({message: error.message});
  } else {
    logger.error('Unexpected error:', error);

    res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
