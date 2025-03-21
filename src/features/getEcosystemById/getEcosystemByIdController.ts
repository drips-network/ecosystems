import {Request, Response} from 'express';
import {handleGetEcosystemById} from './getEcosystemByIdHandler';
import {getEcosystemByIdRequestSchema} from './getEcosystemByIdDto';
import {BadRequestError} from '../../common/application/HttpError';

export const getEcosystemByIdController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedRequest = getEcosystemByIdRequestSchema.safeParse(req.params);
    if (!parsedRequest.success) {
      const formattedErrors = parsedRequest.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestError('Validation failed', formattedErrors);
    }

    const ecosystem = await handleGetEcosystemById(parsedRequest.data);

    res.status(200).json(ecosystem);
  };
