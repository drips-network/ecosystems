import {UUID} from 'crypto';
import {NotFoundError} from '../../common/application/HttpError';
import {Ecosystem} from '../../common/domain/entities.ts/Ecosystem';
import {Edge} from '../../common/domain/entities.ts/Edge';
import {dataSource} from '../../common/infrastructure/datasource';

export async function getEcosystemWithNodesAndEdgesById(id: UUID) {
  const ecosystem = await dataSource
    .getRepository(Ecosystem)
    .createQueryBuilder('ecosystem')
    .leftJoinAndSelect('ecosystem.nodes', 'nodes')
    .where('ecosystem.id = :id', {id})
    .getOne();

  if (!ecosystem) {
    throw new NotFoundError(`Ecosystem with ID '${id}' not found.`);
  }

  let edges: Edge[] = [];

  if (ecosystem.nodes.length > 0) {
    edges = await dataSource
      .getRepository(Edge)
      .createQueryBuilder('edge')
      .leftJoinAndSelect('edge.sourceNode', 'sourceNode')
      .leftJoinAndSelect('edge.targetNode', 'targetNode')
      .where(
        'edge.sourceNodeId IN (:...nodeIds) OR edge.targetNodeId IN (:...nodeIds)',
        {
          nodeIds: ecosystem.nodes.map(node => node.id),
        },
      )
      .getMany();
  }

  return {
    ecosystem,
    edges,
  };
}
