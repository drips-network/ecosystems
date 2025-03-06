import {Router} from 'express';
import {deployEcosystemController} from './deployEcosystemController';
import {asyncWrapper} from '../../../common/application/asyncWrapper';

const router = Router();

const controller = deployEcosystemController();

router.post('/ecosystems/:id/deploy', asyncWrapper(controller));

export {router as deployEcosystemRouter};
