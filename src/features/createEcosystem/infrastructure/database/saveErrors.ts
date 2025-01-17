import {UUID} from 'crypto';
import {logger} from '../../../../infrastructure/logger';
import unreachable from '../../../../application/unreachable';
import {dataSource} from '../../../../infrastructure/datasource';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';

export const saveErrors = async (ecosystemId: UUID, error: string) => {
  logger.info(`Saving errors to database for ecosystem '${ecosystemId}'...`);

  const repository = dataSource.getRepository(Ecosystem);

  const ecosystem = await repository.findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    unreachable(`Ecosystem '${ecosystemId}' not found.`);
  }

  ecosystem.error = error;

  await repository.save(ecosystem);

  logger.info(
    `Saved error '${error}' to database for ecosystem '${ecosystemId}'.`,
  );
};
