import Redis from 'ioredis';
import {config} from '../../config/configLoader';
import {logger} from './logger';

const redis = new Redis(config.redisConnectionString + "?family=0");

redis.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
});

export default redis;
