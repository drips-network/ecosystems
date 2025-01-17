import {Router} from 'express';
import {createEcosystemController} from './createEcosystem.controller';

const router = Router();

const controller = createEcosystemController();

router.post('/ecosystems', controller);

export {router as createEcosystemRouter};
