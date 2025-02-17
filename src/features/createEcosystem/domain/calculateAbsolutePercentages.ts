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

  // Create a mapping of project names to their computed absolute weights.
  const percentages = new Map<ProjectName, number>();
  for (const [projectName, computedNode] of computedGraph.entries()) {
    percentages.set(projectName, computedNode.absoluteWeight);
  }

  return percentages;
}
