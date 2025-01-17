import {Router} from 'express';
import {getEcosystemsController} from './getEcosystems.controller';

const router = Router();

const controller = getEcosystemsController();

router.get('/ecosystems', controller);

export {router as getEcosystemsRouter};
