import {Router} from 'express';
import {createEcosystemController} from './createEcosystem.controller';
import {asyncWrapper} from '../../application/asyncWrapper';

const router = Router();

const controller = createEcosystemController();

router.post('/ecosystems', asyncWrapper(controller));

export {router as createEcosystemRouter};
