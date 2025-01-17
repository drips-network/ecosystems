import {UUID} from 'crypto';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';
import {dataSource} from '../../../../infrastructure/datasource';
import {NewEcosystemRequestDto} from '../../createEcosystem.dto';

export const saveEcosystemIfNotExist = async (
  ecosystemId: UUID,
  newEcosystem: NewEcosystemRequestDto,
) => {
  const repository = dataSource.getRepository(Ecosystem);

  const existingEcosystem = await repository.findOneBy({id: ecosystemId});
  if (existingEcosystem) {
    return existingEcosystem;
  }

  const {name, graph, chainId, ownerAccountId, metadata} = newEcosystem;
  const entity = repository.create({
    name,
    chainId,
    id: ecosystemId,
    rawGraph: graph,
    ownerAccountId,
    metadata: metadata,
    state: 'processing_upload', // Initial state
  });

  return await repository.save(entity);
};
