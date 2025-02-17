import {Request, Response} from 'express';
import {newEcosystemRequestSchema} from './createEcosystemDtos';
import {handleCreateEcosystem} from '../application/createEcosystemHandler';
import {logger} from '../../../common/infrastructure/logger';
import {BadRequestError} from '../../../common/application/HttpError';

export const createEcosystemController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedPayload = newEcosystemRequestSchema.safeParse(req.body);
    if (!parsedPayload.success) {
      const formattedErrors = parsedPayload.error.issues
        .map(issue => `- ${issue.path.join('.')} ${issue.message}`)
        .join('\n');

      throw new BadRequestError(`Validation failed:\n${formattedErrors}`);
    }

    const newEcosystemId = await handleCreateEcosystem(req.body);

    logger.info(`Created ecosystem with id '${newEcosystemId}'.`);

    res.status(201).json(newEcosystemId);
  };
