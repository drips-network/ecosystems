import {Request, Response} from 'express';
import {handleGetEcosystemById} from './getEcosystemById.handler';
import {getEcosystemByIdRequestSchema} from './getEcosystemById.dto';

export const getEcosystemByIdController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedRequest = getEcosystemByIdRequestSchema.safeParse(req.params);
    if (!parsedRequest.success) {
      const formattedErrors = parsedRequest.error.issues
        .map(issue => `- ${issue.path.join('.')} ${issue.message}`)
        .join('\n');

      throw new Error(`Validation failed:\n${formattedErrors}`);
    }

    const ecosystem = await handleGetEcosystemById(parsedRequest.data);

    res.status(200).json(ecosystem);
  };
