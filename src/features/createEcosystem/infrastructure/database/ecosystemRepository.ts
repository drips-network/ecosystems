import {UUID} from 'crypto';
import {EntityManager} from 'typeorm';
import {SuccessfulProcessingResult} from '../redis/loadProcessingResultsFromRedis';
import unreachable from '../../../../common/application/unreachable';
import {Ecosystem} from '../../../../common/domain/entities.ts/Ecosystem';
import {Edge} from '../../../../common/domain/entities.ts/Edge';
import {Node} from '../../../../common/domain/entities.ts/Node';
import {ProjectName} from '../../../../common/domain/types';
import {NewEcosystemRequestDto} from '../../api/createEcosystemDtos';
import {dataSource} from '../../../../common/infrastructure/datasource';

export async function getEcosystemById(
  ecosystemId: UUID,
  manager: EntityManager,
) {
  const ecosystem = await manager.getRepository(Ecosystem).findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    throw new Error(`Ecosystem with id '${ecosystemId}' not found.`);
  }

  return ecosystem;
}

export async function saveNodes(
  ecosystem: Ecosystem,
  successfulResults: SuccessfulProcessingResult[],
  manager: EntityManager,
) {
  const nodeRepository = manager.getRepository(Node);

  const nodes = successfulResults.map(result => {
    const {
      verificationResult: {
        repoDriverId,
        verifiedProjectName,
        originalProjectName,
      },
    } = result;

    return nodeRepository.create({
      ecosystem,
      absoluteWeight: 0,
      originalProjectName,
      projectAccountId: repoDriverId,
      projectName: verifiedProjectName,
    });
  });

  return await manager.save(nodes);
}

export async function saveEdges(
  successfulResults: SuccessfulProcessingResult[],
  ecosystem: Ecosystem,
  nodes: Node[],
  manager: EntityManager,
) {
  const edgeRepository = manager.getRepository(Edge);

  // Create a mapping of original names to verified names.
  const projectNameMap = new Map(
    successfulResults.map(result => [
      result.verificationResult.originalProjectName.toLowerCase(), // Lowercase for case-insensitive lookup.
      result.verificationResult.verifiedProjectName,
    ]),
  ) as Map<ProjectName, string>;

  // Map edges using verified names.
  const edges = successfulResults.flatMap(result =>
    result.edges.map(edge => {
      const verifiedTarget = projectNameMap.get(
        edge.target.toLowerCase() as ProjectName,
      );
      const verifiedSource = projectNameMap.get(
        edge.source.toLowerCase() as ProjectName,
      );
      if (!verifiedTarget) {
        unreachable(
          `Edge references unverified dependency: ${edge.target} from ${result.verificationResult.verifiedProjectName}. ` +
            'This indicates all dependencies were not properly verified.',
        );
      }
      if (!verifiedSource) {
        unreachable(
          `Edge references unverified dependency: ${edge.source} from ${result.verificationResult.verifiedProjectName}. ` +
            'This indicates all dependencies were not properly verified.',
        );
      }

      return {
        source: verifiedSource,
        target: verifiedTarget,
        weight: edge.weight,
      };
    }),
  );

  const existingEdges = await fetchEcosystemEdges(ecosystem, edges, manager);

  const nodeMap = new Map(nodes.map(node => [node.projectName, node]));

  const existingSet = new Set(
    existingEdges.map(
      e => `${e.sourceNode.projectName}<->${e.targetNode.projectName}`,
    ),
  );

  const uniqueEdges = Array.from(
    new Map(
      edges.map(edge => [`${edge.source}<->${edge.target}`, edge]),
    ).values(),
  );

  const edgesToSave = uniqueEdges
    .filter(edge => {
      const key = `${edge.source}<->${edge.target}`;
      return !existingSet.has(key);
    })
    .map(edge => {
      const sourceNode = nodeMap.get(edge.source as ProjectName);
      const targetNode = nodeMap.get(edge.target as ProjectName);

      if (!sourceNode || !targetNode) {
        unreachable(
          `Node not found for edge ${edge.source} -> ${edge.target}. `,
        );
      }

      return edgeRepository.create({
        sourceNode,
        targetNode,
        ecosystemId: ecosystem.id,
        weight: edge.weight,
      });
    });

  if (edgesToSave.length > 0) {
    return await edgeRepository.save(edgesToSave);
  }

  return [];
}

async function fetchEcosystemEdges(
  ecosystem: Ecosystem,
  edges: {source: string; target: string; weight: number}[],
  manager: EntityManager,
): Promise<Edge[]> {
  if (edges.length === 0) return [];

  const valuesClause = edges
    .map((_, index) => `($${index * 2 + 1}::text, $${index * 2 + 2}::text)`)
    .join(', ');
  const parameters: (string | number)[] = [];
  edges.forEach(edge => {
    parameters.push(edge.source, edge.target);
  });

  const sql = `
    WITH edge_vals (source, target) AS (
      VALUES ${valuesClause}
    )
    SELECT edge.*
    FROM public."Edges" edge
    LEFT JOIN public."Nodes" sourceNode ON sourceNode.id = edge."sourceNodeId"
    LEFT JOIN public."Nodes" targetNode ON targetNode.id = edge."targetNodeId"
    JOIN edge_vals ev ON sourceNode."projectName" = ev.source AND targetNode."projectName" = ev.target
    WHERE edge."ecosystemId" = $${parameters.length + 1};
  `;
  parameters.push(ecosystem.id);

  return await manager.query(sql, parameters);
}

export async function updateNodesWithAbsolutePercentages(
  nodes: Node[],
  percentages: Map<ProjectName, number>,
  manager: EntityManager,
) {
  const computedNodes = nodes.map(node => ({
    id: node.id,
    percentage: percentages.get(node.projectName) ?? 0,
  }));
  const batchSize = 500;

  // Process the nodes in batches.
  for (let i = 0; i < computedNodes.length; i += batchSize) {
    const batch = computedNodes.slice(i, i + batchSize);

    const valuesPlaceholders = batch
      .map(
        (_, index) => `($${index * 2 + 1}::uuid, $${index * 2 + 2}::numeric)`,
      )
      .join(', ');

    // Prepare the parameters in the correct order.
    const parameters: (string | number)[] = [];
    batch.forEach(entry => {
      parameters.push(entry.id, entry.percentage);
    });

    // Execute the update query using a CTE and parameterized values.
    await manager.query(
      `
    WITH cte (id, weight) AS (
      VALUES ${valuesPlaceholders}
    )
    UPDATE public."Nodes" AS n
    SET "absoluteWeight" = cte.weight
    FROM cte
    WHERE n."id" = cte.id;
    `,
      parameters,
    );
  }
}

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

export async function saveError(ecosystemId: UUID, error: string) {
  const repository = dataSource.getRepository(Ecosystem);

  const ecosystem = await repository.findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    unreachable(`Ecosystem '${ecosystemId}' not found.`);
  }

  ecosystem.error = error;

  await repository.save(ecosystem);
}
