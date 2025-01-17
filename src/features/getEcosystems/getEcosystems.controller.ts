import {Request, Response} from 'express';
import {handleGetEcosystems} from './getEcosystems.handler';

export const getEcosystemsController =
  () =>
  async (req: Request, res: Response): Promise<void> => {
    const ecosystems = await handleGetEcosystems();

    res.status(200).json(ecosystems);
  };
