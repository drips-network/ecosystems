import {Router} from 'express';
import {getEcosystemByIdController} from './getEcosystemById.controller';

const router = Router();

const controller = getEcosystemByIdController();

router.get('/ecosystems/:id', controller);

export {router as getEcosystemByIdRouter};
