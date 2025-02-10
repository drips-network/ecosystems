import {UUID} from 'crypto';
import {logger} from '../../../../infrastructure/logger';
import {dataSource} from '../../../../infrastructure/datasource';
import {Node} from '../../../../domain/entities.ts/Node';
import {Edge} from '../../../../domain/entities.ts/Edge';
import unreachable from '../../../../application/unreachable';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';
import {SuccessfullyVerifiedProcessingResult} from '../redis/loadProcessingResultsFromRedis';
import {NodeName} from '../../../../domain/types';
import {EntityManager} from 'typeorm';

export const saveGraph = async (
  ecosystemId: UUID,
  successfulJobs: SuccessfullyVerifiedProcessingResult[],
) => {
  logger.info(
    `Saving nodes and edges to database for ecosystem '${ecosystemId}'...`,
  );

  try {
    await dataSource.transaction(async manager => {
      const ecosystem = await getEcosystemById(ecosystemId, manager);

      const nodes = await saveNodes(ecosystem, successfulJobs, manager);

      const edges = await saveEdges(successfulJobs, ecosystem, nodes, manager);

      await saveNodeAbsolutePercentages(nodes, edges, manager);

      logger.info(
        `Successfully saved nodes, edges, and computed percentages for ecosystem '${ecosystemId}'.`,
      );
    });
  } catch (error) {
    logger.error(
      `Failed to save nodes and edges for ecosystem '${ecosystemId}'.`,
      error,
    );

    throw error;
  }
};

const getEcosystemById = async (ecosystemId: UUID, manager: EntityManager) => {
  const ecosystem = await manager.getRepository(Ecosystem).findOneBy({
    id: ecosystemId,
  });
  if (!ecosystem) {
    throw new Error(`Ecosystem with id '${ecosystemId}' not found.`);
  }
  return ecosystem;
};

const saveNodes = async (
  ecosystem: Ecosystem,
  successfulJobs: SuccessfullyVerifiedProcessingResult[],
  manager: EntityManager,
) => {
  const nodeRepository = manager.getRepository(Node);

  const nodes = successfulJobs.map(job => {
    const {repoDriverId, verifiedProjectName, originalProjectName} =
      job.verificationResult;

    return nodeRepository.create({
      ecosystem,
      absoluteWeight: 0,
      originalProjectName,
      projectAccountId: repoDriverId,
      projectName: verifiedProjectName,
    });
  });

  return await nodeRepository.save(nodes);
};

const saveEdges = async (
  successfulJobs: SuccessfullyVerifiedProcessingResult[],
  ecosystem: Ecosystem,
  nodes: Node[],
  manager: EntityManager,
) => {
  const edgeRepository = manager.getRepository(Edge);

  const edges = successfulJobs.flatMap(result => result.job.data.edges);

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
      const sourceNode = nodeMap.get(edge.source as NodeName);
      const targetNode = nodeMap.get(edge.target as NodeName);

      if (!sourceNode || !targetNode) {
        unreachable(`Node not found for edge ${edge.source} -> ${edge.target}`);
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
};

const fetchEcosystemEdges = async (
  ecosystem: Ecosystem,
  edges: {source: string; target: string; weight: number}[],
  manager: EntityManager,
): Promise<Edge[]> => {
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
};

const saveNodeAbsolutePercentages = async (
  nodes: Node[],
  edges: Edge[],
  manager: EntityManager,
) => {
  type ComputedNode = {
    node: Node;
    incomingEdges: Array<{source: string; weight: number}>;
    outgoingEdges: Array<{target: string; weight: number}>;
    absoluteWeight: number;
    inDegree: number; // Number of incoming edges.
  };

  const computedGraph = new Map<NodeName, ComputedNode>();

  for (const node of nodes) {
    computedGraph.set(node.projectName, {
      node,
      incomingEdges: [],
      outgoingEdges: [],
      absoluteWeight: 0,
      inDegree: 0,
    });
  }

  for (const edge of edges) {
    // Normalize weight: if weight > 1, assume it’s given as a percentage (e.g., 100) and convert to decimal.
    const normalizedWeight = edge.weight > 1 ? edge.weight / 100 : edge.weight;
    const sourceEntry = computedGraph.get(edge.sourceNode.projectName);
    const targetEntry = computedGraph.get(edge.targetNode.projectName);
    if (!sourceEntry || !targetEntry) {
      unreachable(
        `Missing computed graph node for edge ${edge.sourceNode.projectName} -> ${edge.targetNode.projectName}`,
      );
    }
    // Outgoing edge from source.
    sourceEntry.outgoingEdges.push({
      target: edge.targetNode.projectName,
      weight: normalizedWeight,
    });
    // Incoming edge to target.
    targetEntry.incomingEdges.push({
      source: edge.sourceNode.projectName,
      weight: normalizedWeight,
    });
  }

  // Set `inDegree` for each node.
  for (const entry of computedGraph.values()) {
    entry.inDegree = entry.incomingEdges.length;
  }

  // For the `root` node assign an initial percentage to 100%.
  const rootNode = computedGraph.get('root');
  if (!rootNode) {
    unreachable('Root node not found in the computed graph.');
  }
  rootNode.absoluteWeight = 1;

  // Propagate percentages in topological order using a pointer-based queue.
  const queue: ComputedNode[] = [rootNode];
  let pointer = 0; // Pointer to the current element in the queue.
  while (pointer < queue.length) {
    const current = queue[pointer];
    pointer++;

    for (const outEdge of current.outgoingEdges) {
      const targetEntry = computedGraph.get(outEdge.target as NodeName)!;

      // Each parent's contribution is parent's absoluteWeight multiplied by the normalized edge weight.
      targetEntry.absoluteWeight += current.absoluteWeight * outEdge.weight;

      // Decrement the `inDegree` (dependency counter).
      targetEntry.inDegree--;
      if (targetEntry.inDegree === 0) {
        queue.push(targetEntry);
      }
    }
  }

  const computedNodes = Array.from(computedGraph.values());
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
      parameters.push(entry.node.id, entry.absoluteWeight);
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
};
