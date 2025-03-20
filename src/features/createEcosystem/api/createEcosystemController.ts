import {Request, Response} from 'express';
import {newEcosystemRequestSchema} from './createEcosystemDtos';
import {handleCreateEcosystem} from '../application/createEcosystemHandler';
import {logger} from '../../../common/infrastructure/logger';
import {BadRequestError} from '../../../common/application/HttpError';

export const createEcosystemController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    logger.info('Received request to create a new ecosystem.');

    const parsedPayload = newEcosystemRequestSchema.safeParse(req.body);
    if (!parsedPayload.success) {
      const formattedErrors = parsedPayload.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestError('Validation failed', formattedErrors);
    }

    const ecosystemId = await handleCreateEcosystem(req.body);

    logger.info(
      `Ecosystem creation initiated successfully. Ecosystem ID: '${ecosystemId}'.`,
    );

    res.status(201).json({
      id: ecosystemId,
    });
  };
