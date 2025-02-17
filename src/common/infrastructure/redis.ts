import Redis from 'ioredis';
import {logger} from './logger';
import {config} from '../../config/configLoader';

const redis = new Redis(config.redisConnectionString);

redis.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
});

export default redis;
