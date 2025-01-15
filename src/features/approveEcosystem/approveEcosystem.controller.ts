import {Request, Response} from 'express';
import {Repository} from 'typeorm';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {handleApproveEcosystem} from './approveEcosystem.handler';
import {Logger} from 'winston';
import {isValidUUID} from '../../utils/isValidUUID';
import {ValidationError} from '../../errors/HttpError';
import {UUID} from 'crypto';

type Dependencies = {
  repository: Repository<Ecosystem>;
  logger: Logger;
};

export const approveEcosystemController =
  ({repository, logger}: Dependencies) =>
  async (req: Request, res: Response): Promise<void> => {
    if (!isValidUUID(req.params.id)) {
      throw new ValidationError('Invalid ecosystem ID');
    }

    await handleApproveEcosystem(req.params.id as UUID, repository, logger);

    logger.info(
      `Ecosystem '${req.params.id}' approved and deployed successfully.`,
    );

    res.status(204).send();
  };
