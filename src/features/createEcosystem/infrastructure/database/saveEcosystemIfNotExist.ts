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

  const {name, graph, chainId, metadata, ownerAddress} = newEcosystem;
  const entity = repository.create({
    name,
    chainId,
    ownerAddress,
    id: ecosystemId,
    rawGraph: graph,
    metadata: metadata,
    state: 'processing_graph',
  });

  return await repository.save(entity);
};
