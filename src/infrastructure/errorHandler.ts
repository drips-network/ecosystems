import {Request, Response, NextFunction} from 'express';
import {HttpError} from '../application/HttpError';
import {logger} from '../infrastructure/logger';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    logger.warn(`${error.message} (status: ${error.statusCode})`);

    res.status(error.statusCode).json({message: error.message});
  } else {
    logger.error('Unexpected error:', error);

    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};
