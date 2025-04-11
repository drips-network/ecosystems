import {Request, Response} from 'express';
import {deployEcosystemRequestSchema} from './deployEcosystemDto';
import {BadRequestError} from '../../../common/application/HttpError';
import {handleDeployEcosystem} from '../application/deployEcosystemHandler';
import {logger} from '../../../common/infrastructure/logger';

export const deployEcosystemController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedRequest = deployEcosystemRequestSchema.safeParse({
      params: req.params,
    });
    if (!parsedRequest.success) {
      const formattedErrors = parsedRequest.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestError('Validation failed', formattedErrors);
    }

    logger.info(
      `Received request to deploy '${parsedRequest.data.params.id}' ecosystem.`,
    );

    const queue = await handleDeployEcosystem(parsedRequest.data);

    logger.info(
      `Ecosystem deployment initiated successfully.${queue ? ` Transactions queue: '${queue}'` : ''}.`,
    );

    res.status(200).json({
      message: 'Ecosystem deployment initiated successfully.',
    });
  };
