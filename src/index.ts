import express from 'express';
import {logger} from './logger/logger';
import {AppDataSource} from './db/AppDatasource';
import {config} from './config/configLoader';
import {errorHandler} from './middleware/errorHandler';
import {createEcosystemRouter} from './features/createEcosystem/createEcosystem.router';
import {approveEcosystemRouter} from './features/approveEcosystem/approveEcosystem.router';

const app = express();

app.use(express.json());
app.use('/api', createEcosystemRouter);
app.use('/api', approveEcosystemRouter);
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully.');

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
