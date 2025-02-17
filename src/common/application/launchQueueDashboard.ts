import express, {Router} from 'express';
import Arena from 'bull-arena';
import BeeQueue from 'bee-queue';
import Redis from 'ioredis';
import {RequestHandler} from 'express';
import {config} from '../../config/configLoader';

let arenaRouter: Router | null = null;
const redis = new Redis(config.redisConnectionString);

export const getQueuesFromRedis = async (): Promise<
  {
    type: 'bee';
    name: string;
    redis: {url: string};
    hostId: string;
  }[]
> => {
  const queuePattern = 'bq:ecosystem-*-chain-*';
  const queueNames = new Set<string>();
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${queuePattern}:id`,
      'COUNT',
      100,
    );
    cursor = nextCursor;

    keys.forEach(key => {
      const queueName = key.slice(0, key.lastIndexOf(':'));
      queueNames.add(queueName.replace('bq:', ''));
    });
  } while (cursor !== '0');

  return Array.from(queueNames).map(queueName => ({
    type: 'bee',
    name: queueName,
    redis: {
      url: config.redisConnectionString,
    },
    hostId: 'ecosystems_queue',
  }));
};

export const launchQueueDashboard = async (app: express.Express) => {
  const queues = await getQueuesFromRedis();

  if (queues.length === 0) {
    return;
  }

  const arenaConfig = Arena(
    {
      Bee: BeeQueue,
      queues,
    },
    {
      basePath: '/',
      disableListen: true,
    },
  ) as unknown as RequestHandler;

  // Remove the old Arena Router if it exists
  if (arenaRouter) {
    app._router.stack = app._router.stack.filter(
      (layer: {handle: express.Router | null}) => layer.handle !== arenaRouter,
    );
  }

  // Create a new Router and mount Arena
  arenaRouter = Router();
  arenaRouter.use(arenaConfig);
  app.use('/arena', arenaRouter);
};
