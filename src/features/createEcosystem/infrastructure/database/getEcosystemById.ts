import {UUID} from 'crypto';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';
import {dataSource} from '../../../../infrastructure/datasource';

export const getEcosystemById = async (ecosystemId: UUID) => {
  const ecosystem = await dataSource.getRepository(Ecosystem).findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    throw new Error(`Ecosystem with id '${ecosystemId}' not found.`);
  }

  return ecosystem;
};
