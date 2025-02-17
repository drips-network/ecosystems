import {Router} from 'express';
import {createEcosystemController} from './createEcosystemController';
import {asyncWrapper} from '../../../common/application/asyncWrapper';

const router = Router();

const controller = createEcosystemController();

router.post('/ecosystems', asyncWrapper(controller));

export {router as createEcosystemRouter};
