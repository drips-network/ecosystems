import {Job} from 'bee-queue';
import {UUID} from 'crypto';
import {ProjectVerificationJobData} from '../queue/createEcosystemQueue';
import {SuccessfulVerificationResult} from '../github/verifyNode';
import {logger} from '../../../../infrastructure/logger';
import {getEcosystemById} from './getEcosystemById';
import {dataSource} from '../../../../infrastructure/datasource';
import {Node} from '../../../../domain/entities.ts/Node';
import {Edge} from '../../../../domain/entities.ts/Edge';
import {Brackets} from 'typeorm';
import {NodeName} from '../../../../domain/types';
import unreachable from '../../../../application/unreachable';

export const saveNodesAndEdges = async (
  ecosystemId: UUID,
  successfulJobs: Job<
    ProjectVerificationJobData & {
      verificationResult: SuccessfulVerificationResult;
    }
  >[],
) => {
  try {
    logger.info(
      `Saving nodes and edges to database for ecosystem '${ecosystemId}'...`,
    );

    const ecosystem = await getEcosystemById(ecosystemId);
    const nodeRepository = dataSource.getRepository(Node);
    const edgeRepository = dataSource.getRepository(Edge);

    // Save all nodes.
    const nodes = await Promise.all(
      successfulJobs.map(async job => {
        const {
          verificationResult: {
            repoDriverId,
            verifiedProjectName,
            originalProjectName,
          },
        } = job.data;

        const node = nodeRepository.create({
          ecosystem,
          projectName: verifiedProjectName,
          repoDriverId,
          originalProjectName,
        });

        return await nodeRepository.save(node);
      }),
    );

    const nodeMap = new Map(nodes.map(node => [node.projectName, node]));

    const edges = successfulJobs.flatMap(job => job.data.edges);

    // Check which edges already exist.
    const existingEdges: Edge[] = await edgeRepository
      .createQueryBuilder('edge')
      .where('edge.ecosystemId = :ecosystemId', {ecosystemId: ecosystem.id})
      .andWhere(
        new Brackets(qb => {
          edges.forEach((edge, index) => {
            qb.orWhere(
              'edge.sourceNodeId IN (SELECT id FROM public."Nodes" WHERE "projectName" = :source' +
                index +
                ') ' +
                'AND edge.targetNodeId IN (SELECT id FROM public."Nodes" WHERE "projectName" = :target' +
                index +
                ')',
              {
                ['source' + index]: edge.source,
                ['target' + index]: edge.target,
              },
            );
          });
        }),
      )
      .select(['edge.sourceNodeId', 'edge.targetNodeId'])
      .getRawMany();

    // Create Set of existing edge keys.
    const existingEdgeSet = new Set(
      existingEdges.map(
        e => `${e.sourceNode.projectName}<->${e.targetNode.projectName}`,
      ),
    );

    // Create new edges that don't exist.
    const edgesToSave: Edge[] = [];

    for (const edge of edges) {
      const edgeKey = `${edge.source}<->${edge.target}`;

      if (!existingEdgeSet.has(edgeKey)) {
        const sourceNode = nodeMap.get(edge.source as NodeName);
        const targetNode = nodeMap.get(edge.target as NodeName);

        if (sourceNode && targetNode) {
          const edgeEntity = edgeRepository.create({
            sourceNodeId: sourceNode.id,
            targetNodeId: targetNode.id,
            ecosystemId: ecosystem.id,
            weight: edge.weight,
          });

          edgesToSave.push(edgeEntity);

          existingEdgeSet.add(edgeKey);
        } else {
          unreachable(`Node not found for edge '${edgeKey}'.`);
        }
      }
    }

    // Save new edges.
    if (edgesToSave.length > 0) {
      await edgeRepository.save(edgesToSave);
    }

    logger.info(
      `Successfully saved nodes and edges for ecosystem '${ecosystemId}'.`,
    );
    return {
      savedJobIds: successfulJobs.map(job => job.id),
    };
  } catch (error) {
    logger.error(
      `Failed to save nodes and edges for ecosystem '${ecosystemId}'.`,
      error,
    );

    throw error;
  }
};
