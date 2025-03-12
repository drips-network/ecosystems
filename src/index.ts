import {logger} from './common/infrastructure/logger';
import {dataSource} from './common/infrastructure/datasource';
import {app} from './app';
import {exit} from 'process';
import {config} from './config/configLoader';
import {launchQueueDashboard} from './common/application/launchQueueDashboard';
import runMigrations from './common/infrastructure/migrations';

dataSource
  .initialize()
  .then(async () => {
    logger.info('Database connected successfully.');
    logger.info(`Config: ${JSON.stringify(config, null, 2)}`);

    await launchDevQueueDashboard();

    await runMigrations();

    app.listen(config.port, () => {
      logger.info(
        `Server is running in ${config.nodeEnv} mode on http://localhost:${config.port} 🚀`,
      );
    });
  })
  .catch(error => {
    logger.error('Database connection failed:', error);
    exit(1);
  });

async function launchDevQueueDashboard() {
  if (config.nodeEnv === 'development') {
    logger.info(
      `Starting queue dashboard on http://localhost:${config.port}/arena`,
    );

    await launchQueueDashboard(app);
    setInterval(async () => {
      await launchQueueDashboard(app);
    }, 6000);
  }
}
