import {Router} from 'express';
import {getEcosystemByIdController} from './getEcosystemByIdController';
import {asyncWrapper} from '../../common/application/asyncWrapper';

const router = Router();

const controller = getEcosystemByIdController();

router.get('/ecosystems/:id', asyncWrapper(controller));

export {router as getEcosystemByIdRouter};
