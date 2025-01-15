import {Request, Response} from 'express';
import {Repository} from 'typeorm';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {handleCreateEcosystem} from './createEcosystem.handler';
import {Logger} from 'winston';
import {NewEcosystemPayloadSchema} from './createEcosystem.dto';
import {ValidationError} from '../../errors/HttpError';

type Dependencies = {
  repository: Repository<Ecosystem>;
  logger: Logger;
};

export const createEcosystemController =
  ({repository, logger}: Dependencies) =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedPayload = NewEcosystemPayloadSchema.safeParse(req.body);
    if (!parsedPayload.success) {
      throw new ValidationError(
        `Validation failed: ${JSON.stringify(parsedPayload.error)}`,
      );
    }

    const newEcosystem = await handleCreateEcosystem(
      parsedPayload.data,
      repository,
      logger,
    );

    logger.info(
      `Ecosystem created successfully: ${JSON.stringify(newEcosystem)}`,
    );

    res.status(201).json(newEcosystem);
  };
