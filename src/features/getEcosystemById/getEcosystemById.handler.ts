import {UUID} from 'crypto';
import {Ecosystem} from '../../domain/entities.ts/Ecosystem';
import {NotFoundError} from '../../application/HttpError';
import {
  GetEcosystemByIdRequestDto,
  GetEcosystemByIdResponseDto,
} from './getEcosystemById.dto';
import {dataSource} from '../../infrastructure/datasource';
import {Edge} from '../../domain/entities.ts/Edge';

export const handleGetEcosystemById = async (
  request: GetEcosystemByIdRequestDto,
): Promise<GetEcosystemByIdResponseDto> => {
  const ecosystem = await dataSource
    .getRepository(Ecosystem)
    .createQueryBuilder('ecosystem')
    .leftJoinAndSelect('ecosystem.nodes', 'nodes')
    .where('ecosystem.id = :id', {id: request.id as UUID})
    .getOne();

  if (!ecosystem) {
    throw new NotFoundError(`Ecosystem with ID '${request.id}' not found.`);
  }

  const edges = await dataSource
    .getRepository(Edge)
    .createQueryBuilder('edge')
    .leftJoinAndSelect('edge.sourceNode', 'sourceNode')
    .leftJoinAndSelect('edge.targetNode', 'targetNode')
    .where(
      'edge.sourceNode IN (:...nodeIds) OR edge.targetNode IN (:...nodeIds)',
      {
        nodeIds: ecosystem.nodes.map(node => node.id),
      },
    )
    .getMany();

  return {
    id: ecosystem.id,
    state: ecosystem.state,
    accountId: ecosystem.accountId,
    name: ecosystem.name,
    description: ecosystem.description,
    metadata: ecosystem.metadata as GetEcosystemByIdResponseDto['metadata'],
    graph: {
      nodes: ecosystem.nodes.map(node => ({
        projectAccountId: node.projectAccountId,
        absoluteWeight: node.absoluteWeight,
        repoOwner:
          node.projectName === 'root' ? 'root' : node.projectName.split('/')[0],
        repoName:
          node.projectName === 'root' ? 'root' : node.projectName.split('/')[1],
      })),
      edges: edges.map(edge => ({
        source: edge.sourceNode.projectAccountId,
        target: edge.targetNode.projectAccountId,
        weight: edge.weight,
      })),
    },
  };
};
