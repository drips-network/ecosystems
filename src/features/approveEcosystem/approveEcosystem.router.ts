import {Router} from 'express';
import {approveEcosystemController} from './approveEcosystem.controller';
import {asyncHandler} from '../../utils/asyncHandler';
import {AppDataSource} from '../../db/AppDatasource';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {logger} from '../../logger/logger';

const router = Router();

const dependencies = {
  repository: AppDataSource.getRepository(Ecosystem),
  logger,
};

const controller = approveEcosystemController(dependencies);

router.post('/ecosystems/:id/approve', asyncHandler(controller));

export {router as approveEcosystemRouter};
