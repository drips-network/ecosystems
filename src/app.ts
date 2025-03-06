import express from 'express';
import {createEcosystemRouter} from './features/createEcosystem/api/createEcosystemRouter';
import {getEcosystemsRouter} from './features/getEcosystems/getEcosystemsRouter';
import {getEcosystemByIdRouter} from './features/getEcosystemById/getEcosystemByIdRouter';
import {errorHandler} from './common/infrastructure/errorHandler';
import {deployEcosystemRouter} from './features/deployEcosystem/api/deployEcosystemRouter';

export const app = express();

const authenticateApiKey = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const apiKey = req.headers.authorization;
  if (apiKey && apiKey === `Bearer ${process.env.API_KEY}`) {
    next();
  } else {
    res.status(401).json({message: 'Unauthorized'});
  }
};

app.use(authenticateApiKey);
app.use(express.json({limit: '50mb'}));
app.use('/api', createEcosystemRouter);
app.use('/api', getEcosystemsRouter);
app.use('/api', getEcosystemByIdRouter);
app.use('/api', deployEcosystemRouter);
app.use(errorHandler);
