import {Router} from 'express';
import {deployEcosystemController} from './deployEcosystem.controller';
import {asyncWrapper} from '../../application/asyncWrapper';

const router = Router();

const controller = deployEcosystemController();

router.post('/ecosystems/:id/deploy', asyncWrapper(controller));

export {router as deployEcosystemRouter};
