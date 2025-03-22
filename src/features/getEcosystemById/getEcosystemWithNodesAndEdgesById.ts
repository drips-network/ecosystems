import {UUID} from 'crypto';
import {NotFoundError} from '../../common/application/HttpError';
import {Ecosystem} from '../../common/domain/entities.ts/Ecosystem';
import {Edge} from '../../common/domain/entities.ts/Edge';
import {dataSource} from '../../common/infrastructure/datasource';
import {Node} from '../../common/domain/entities.ts/Node';

export async function getEcosystemWithNodesAndEdgesById(id: UUID): Promise<{
  ecosystem: Ecosystem;
  edges: Edge[];
}> {
  const ecosystemRepository = dataSource.getRepository(Ecosystem);
  const ecosystem = await ecosystemRepository
    .createQueryBuilder('ecosystem')
    .select([
      'ecosystem.id',
      'ecosystem.state',
      'ecosystem.accountId',
      'ecosystem.name',
      'ecosystem.description',
      'ecosystem.metadata',
      'ecosystem.avatar',
      'ecosystem.color',
    ])
    .where('ecosystem.id = :id', {id})
    .getOne();

  if (!ecosystem) {
    throw new NotFoundError(`Ecosystem with ID '${id}' not found.`);
  }

  const nodeRepository = dataSource.getRepository(Node);
  const nodes = await nodeRepository
    .createQueryBuilder('node')
    .select([
      'node.id',
      'node.projectAccountId',
      'node.absoluteWeight',
      'node.projectName',
    ])
    .where('node.ecosystemId = :id', {id})
    .getMany();

  // Assign the optimized nodes array to the ecosystem.
  ecosystem.nodes = nodes;

  let edges: Edge[] = [];
  if (nodes.length > 0) {
    const nodeIds = nodes.map(node => node.id);
    edges = await dataSource
      .getRepository(Edge)
      .createQueryBuilder('edge')
      .leftJoinAndSelect('edge.sourceNode', 'sourceNode')
      .leftJoinAndSelect('edge.targetNode', 'targetNode')
      .where(
        'edge.sourceNodeId IN (:...nodeIds) OR edge.targetNodeId IN (:...nodeIds)',
        {
          nodeIds,
        },
      )
      .getMany();
  }

  return {
    ecosystem,
    edges,
  };
}
