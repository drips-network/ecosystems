import {Ecosystem} from '../../common/domain/entities.ts/Ecosystem';
import {dataSource} from '../../common/infrastructure/datasource';
import {GetEcosystemsResponseDto, MetadataDto} from './getEcosystemsDto';

export const handleGetEcosystems =
  async (): Promise<GetEcosystemsResponseDto> => {
    const ecosystemsWithCounts = await dataSource
      .getRepository(Ecosystem)
      .createQueryBuilder('ecosystem')
      .select('ecosystem')
      .loadRelationCountAndMap('ecosystem.nodeCount', 'ecosystem.nodes', 'node')
      .getMany();

    return ecosystemsWithCounts.map(ecosystem => ({
      id: ecosystem.id,
      state: ecosystem.state,
      accountId: ecosystem.accountId,
      name: ecosystem.name,
      avatar: ecosystem.avatar,
      description: ecosystem.description,
      nodeCount: Math.max(0, (ecosystem as any).nodeCount - 1), // Subtract 1 to exclude `root` node.
      metadata: ecosystem.metadata as MetadataDto,
    }));
  };
