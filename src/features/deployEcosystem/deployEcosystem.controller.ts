import {Request, Response} from 'express';
import {deployEcosystemRequestSchema} from './deployEcosystem.dto';
import {handleDeployEcosystem} from './deployEcosystem.handler';

export const deployEcosystemController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const parsedRequest = deployEcosystemRequestSchema.safeParse(req.params);
    if (!parsedRequest.success) {
      const formattedErrors = parsedRequest.error.issues
        .map(issue => `- ${issue.path.join('.')} ${issue.message}`)
        .join('\n');

      throw new Error(`Validation failed:\n${formattedErrors}`);
    }

    const ecosystem = await handleDeployEcosystem(parsedRequest.data);

    res.status(200).json(ecosystem);
  };
