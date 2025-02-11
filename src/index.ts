import express from 'express';
import {logger} from './infrastructure/logger';
import {dataSource} from './infrastructure/datasource';
import {createEcosystemRouter} from './features/createEcosystem/createEcosystem.router';
import {launchQueueDashboard} from './features/createEcosystem/infrastructure/queue/launchQueueDashboard';
import {getEcosystemsRouter} from './features/getEcosystems/getEcosystems.router';
import {errorHandler} from './infrastructure/errorHandler';
import {config} from './infrastructure/config/configLoader';
import {getEcosystemByIdRouter} from './features/getEcosystemById/getEcosystemById.router';
import {deployEcosystemRouter} from './features/deployEcosystem/deployEcosystem.router';

const app = express();

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
app.use(
  express.json({
    limit: '50mb',
  }),
);
app.use('/api', createEcosystemRouter);
app.use('/api', getEcosystemsRouter);
app.use('/api', getEcosystemByIdRouter);
app.use('/api', deployEcosystemRouter);
app.use(errorHandler);

dataSource
  .initialize()
  .then(async () => {
    logger.info('Database connected successfully.');
    logger.info(`Config: ${JSON.stringify(config, null, 2)}`);

    await launchDevQueueDashboard();

    app.listen(config.port, () => {
      logger.info(
        `Server is running in ${config.nodeEnv} mode on http://localhost:${config.port} 🚀`,
      );
    });
  })
  .catch(error => {
    logger.error('Database connection failed:', error);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });

const launchDevQueueDashboard = async () => {
  if (config.nodeEnv === 'development') {
    logger.info(
      `Starting queue dashboard on http://localhost:${config.port}/arena`,
    );

    await launchQueueDashboard(app);

    setInterval(async () => {
      await launchQueueDashboard(app);
    }, 6000);
  }
};
