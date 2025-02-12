import {Router} from 'express';
import {getEcosystemByIdController} from './getEcosystemById.controller';
import {asyncWrapper} from '../../application/asyncWrapper';

const router = Router();

const controller = getEcosystemByIdController();

router.get('/ecosystems/:id', asyncWrapper(controller));

export {router as getEcosystemByIdRouter};
