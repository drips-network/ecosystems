import {Router} from 'express';
import {getEcosystemsController} from './getEcosystemsController';
import {asyncWrapper} from '../../common/application/asyncWrapper';

const router = Router();

const controller = getEcosystemsController();

router.get('/ecosystems', asyncWrapper(controller));

export {router as getEcosystemsRouter};
