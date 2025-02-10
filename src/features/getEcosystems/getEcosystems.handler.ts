import {Ecosystem} from '../../domain/entities.ts/Ecosystem';
import {dataSource} from '../../infrastructure/datasource';
import {GetEcosystemsResponseDto, MetadataDto} from './getEcosystems.dto';

export const handleGetEcosystems =
  async (): Promise<GetEcosystemsResponseDto> => {
    const repository = dataSource.getRepository(Ecosystem);

    const ecosystems = await repository.find({
      relations: ['nodes'],
    });

    return ecosystems.map(ecosystem => ({
      id: ecosystem.id,
      state: ecosystem.state,
      accountId: ecosystem.accountId,
      name: ecosystem.name,
      description: ecosystem.description,
      nodeCount: ecosystem.nodes.length,
      metadata: ecosystem.metadata as MetadataDto,
    }));
  };
