import {Router} from 'express';
import {getEcosystemsController} from './getEcosystems.controller';
import {asyncWrapper} from '../../application/asyncWrapper';

const router = Router();

const controller = getEcosystemsController();

router.get('/ecosystems', asyncWrapper(controller));

export {router as getEcosystemsRouter};
