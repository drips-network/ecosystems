import unreachable from '../../../common/application/unreachable';
import {Edge} from '../../../common/domain/entities.ts/Edge';
import {Node} from '../../../common/domain/entities.ts/Node';
import {ProjectName} from '../../../common/domain/types';

export async function calculateAbsolutePercentages(
  nodes: Node[],
  edges: Edge[],
) {
  type ComputedNode = {
    node: Node;
    incomingEdges: Array<{source: ProjectName; weight: number}>;
    outgoingEdges: Array<{target: ProjectName; weight: number}>;
    absoluteWeight: number;
    inDegree: number;
  };

  const computedGraph = new Map<ProjectName, ComputedNode>();

  // Initialize the graph
  for (const node of nodes) {
    computedGraph.set(node.projectName, {
      node,
      incomingEdges: [],
      outgoingEdges: [],
      absoluteWeight: 0,
      inDegree: 0,
    });
  }

  // Build edge relationships
  for (const edge of edges) {
    const sourceEntry = computedGraph.get(edge.sourceNode.projectName);
    const targetEntry = computedGraph.get(edge.targetNode.projectName);

    if (!sourceEntry || !targetEntry) {
      unreachable(
        `Missing computed graph node for edge ${edge.sourceNode.projectName} -> ${edge.targetNode.projectName}`,
      );
    }

    sourceEntry.outgoingEdges.push({
      target: edge.targetNode.projectName,
      weight: edge.weight,
    });

    targetEntry.incomingEdges.push({
      source: edge.sourceNode.projectName,
      weight: edge.weight,
    });
  }

  // Set inDegree for each node
  for (const entry of computedGraph.values()) {
    entry.inDegree = entry.incomingEdges.length;
  }

  // Initialize root node
  const rootNode = computedGraph.get('root');
  if (!rootNode) {
    unreachable('Root node not found in the computed graph.');
  }
  rootNode.absoluteWeight = 1;

  // Process nodes in topological order
  const queue: ComputedNode[] = [rootNode];
  let pointer = 0;

  while (pointer < queue.length) {
    const current = queue[pointer];
    pointer++;

    // Calculate total outgoing weight
    const totalOutgoingWeight = current.outgoingEdges.reduce(
      (sum, edge) => sum + edge.weight,
      0,
    );

    // For each outgoing edge, distribute the specified weight percentage
    for (const outEdge of current.outgoingEdges) {
      const targetEntry = computedGraph.get(outEdge.target)!;

      // Pass the weight to the child
      targetEntry.absoluteWeight += current.absoluteWeight * outEdge.weight;

      targetEntry.inDegree--;
      if (targetEntry.inDegree === 0) {
        queue.push(targetEntry);
      }
    }

    // Subtract the distributed weight from the current node
    // The node keeps only the weight it didn't distribute
    current.absoluteWeight *= 1 - totalOutgoingWeight;
  }

  // Create final mapping
  const percentages = new Map<ProjectName, number>();
  for (const [projectName, computedNode] of computedGraph.entries()) {
    percentages.set(projectName, computedNode.absoluteWeight);
  }

  return percentages;
}
