import {Router} from 'express';
import {createEcosystemController} from './createEcosystem.controller';
import {asyncHandler} from '../../utils/asyncHandler';
import {AppDataSource} from '../../db/AppDatasource';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {logger} from '../../logger/logger';

const router = Router();

const dependencies = {
  repository: AppDataSource.getRepository(Ecosystem),
  logger,
};

const controller = createEcosystemController(dependencies);

router.post('/ecosystems', asyncHandler(controller));

export {router as createEcosystemRouter};
