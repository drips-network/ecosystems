import {Router} from 'express';
import {deployEcosystemController} from './deployEcosystem.controller';

const router = Router();

const controller = deployEcosystemController();

router.post('/ecosystems/:id/deploy', controller);

export {router as deployEcosystemRouter};
