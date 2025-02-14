import {UUID} from 'crypto';
import {logger} from '../../../../infrastructure/logger';
import {dataSource} from '../../../../infrastructure/datasource';
import {Node} from '../../../../domain/entities.ts/Node';
import {Edge} from '../../../../domain/entities.ts/Edge';
import unreachable from '../../../../application/unreachable';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';
import {ProjectName} from '../../../../domain/types';
import {EntityManager} from 'typeorm';
import {SuccessfulProcessingResult} from '../redis/loadProcessingResultsFromRedis';

export default async function saveGraph(
  ecosystemId: UUID,
  successfulResults: SuccessfulProcessingResult[],
) {
  await dataSource.transaction(async manager => {
    const ecosystem = await getEcosystemById(ecosystemId, manager);
    const nodes = await saveNodes(ecosystem, successfulResults, manager);
    const edges = await saveEdges(successfulResults, ecosystem, nodes, manager);

    await saveNodeAbsolutePercentages(nodes, edges, manager);
  });

  logger.info(
    `Successfully saved nodes, edges, and computed percentages for ecosystem '${ecosystemId}'.`,
  );
}

async function getEcosystemById(ecosystemId: UUID, manager: EntityManager) {
  const ecosystem = await manager.getRepository(Ecosystem).findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    throw new Error(`Ecosystem with id '${ecosystemId}' not found.`);
  }

  return ecosystem;
}

async function saveNodes(
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

async function saveEdges(
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

async function saveNodeAbsolutePercentages(
  nodes: Node[],
  edges: Edge[],
  manager: EntityManager,
) {
  type ComputedNode = {
    node: Node;
    incomingEdges: Array<{source: string; weight: number}>;
    outgoingEdges: Array<{target: string; weight: number}>;
    absoluteWeight: number;
    inDegree: number; // Number of incoming edges.
  };

  const computedGraph = new Map<ProjectName, ComputedNode>();

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
      weight: edge.weight,
    });
    // Incoming edge to target.
    targetEntry.incomingEdges.push({
      source: edge.sourceNode.projectName,
      weight: edge.weight,
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
      const targetEntry = computedGraph.get(outEdge.target as ProjectName)!;

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
}
