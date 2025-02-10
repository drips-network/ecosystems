import {ValidationError} from '../../../application/HttpError';
import {GraphDto} from '../createEcosystem.dto';

const checkRootNodeExists = (graph: GraphDto): string[] => {
  const {nodes} = graph;
  const errors: string[] = [];

  const rootNodes = nodes.filter(node => node.projectName === 'root');
  if (rootNodes.length === 0) {
    errors.push('Root node not found.');
  } else if (rootNodes.length > 1) {
    errors.push('More than one root node found.');
  }

  return errors;
};

const checkTotalRootsWeight = (graph: GraphDto): string[] => {
  const {edges} = graph;
  const errors: string[] = [];

  const rootEdges = edges.filter(edge => edge.source === 'root');

  const totalWeight = rootEdges.reduce((sum, edge) => sum + edge.weight, 0);
  if (totalWeight !== 100) {
    errors.push(
      `Total weight of edges from 'root' must sum to 100, but got ${totalWeight}.`,
    );
  }

  return errors;
};

const checkDisconnectedNodes = (graph: GraphDto): string[] => {
  const {nodes, edges} = graph;
  const errors: string[] = [];

  const nodeSet = new Set(nodes.map(node => node.projectName));
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const disconnectedNodes = [...nodeSet].filter(
    node => !connectedNodes.has(node),
  );
  if (disconnectedNodes.length > 0) {
    errors.push(`Nodes without any edges: ${disconnectedNodes.join(', ')}.`);
  }

  return errors;
};

const checkForCycles = (graph: GraphDto): string[] => {
  const {nodes, edges} = graph;
  const errors: string[] = [];

  const adjacencyList = new Map<string, string[]>();
  edges.forEach(({source, target}) => {
    if (!adjacencyList.has(source)) adjacencyList.set(source, []);
    adjacencyList.get(source)!.push(target);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (const neighbor of adjacencyList.get(node) || []) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  }

  for (const node of nodes.map(n => n.projectName)) {
    if (!visited.has(node) && dfs(node)) {
      errors.push(`Cycle detected starting from node '${node}'.`);
      break;
    }
  }

  return errors;
};

const checkInvalidRootEdges = (graph: GraphDto): string[] => {
  const {edges} = graph;
  const errors: string[] = [];

  const invalidEdges = edges.filter(edge => edge.target === 'root');
  if (invalidEdges.length > 0) {
    errors.push(
      `Edges targeting 'root' are not allowed: ${invalidEdges
        .map(e => `${e.source} -> ${e.target}`)
        .join(', ')}.`,
    );
  }

  return errors;
};

const checkForDuplicateNodes = (graph: GraphDto): string[] => {
  const {nodes} = graph;
  const errors: string[] = [];

  const nodeSet = new Set();
  nodes.forEach(node => {
    if (nodeSet.has(node.projectName)) {
      errors.push(`Duplicate node found: ${node.projectName}.`);
    }
    nodeSet.add(node.projectName);
  });

  return errors;
};

const checkForDuplicateConnections = (graph: GraphDto): string[] => {
  const {edges} = graph;
  const errors: string[] = [];

  const edgeSet = new Set();
  edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    if (edgeSet.has(key)) {
      errors.push(`Duplicate connection found: ${key}.`);
    }
    edgeSet.add(key);
  });

  return errors;
};

const checkForTwoWayEdges = (graph: GraphDto): string[] => {
  const {edges} = graph;
  const errors: string[] = [];

  const edgeSet = new Set(edges.map(edge => `${edge.source}->${edge.target}`));
  edges.forEach(edge => {
    if (edgeSet.has(`${edge.target}->${edge.source}`)) {
      errors.push(`Two-way edge detected: ${edge.source} <-> ${edge.target}.`);
    }
  });

  return errors;
};

const checkForMissingNodes = (graph: GraphDto): string[] => {
  const {nodes, edges} = graph;
  const errors: string[] = [];

  const nodeNames = new Set(nodes.map(node => node.projectName));
  edges.forEach(edge => {
    if (edge.source !== 'root' && !nodeNames.has(edge.source)) {
      errors.push(`Edge source '${edge.source}' does not exist in nodes.`);
    }
    if (edge.target !== 'root' && !nodeNames.has(edge.target)) {
      errors.push(`Edge target '${edge.target}' does not exist in nodes.`);
    }
  });

  return errors;
};

const checkForOrphanNodes = (graph: GraphDto): string[] => {
  const {nodes, edges} = graph;
  const errors: string[] = [];

  // Get all nodes that are targets (have incoming edges).
  const nodesWithIncomingEdges = new Set(edges.map(edge => edge.target));

  // Find nodes that have no incoming edges (except root).
  const orphanNodes = nodes.filter(
    node =>
      node.projectName !== 'root' &&
      !nodesWithIncomingEdges.has(node.projectName),
  );

  if (orphanNodes.length > 0) {
    errors.push(
      `Nodes with no incoming edges detected: ${orphanNodes.map(node => node.projectName).join(', ')}.`,
    );
  }

  return errors;
};

const checkMaxNodeCount = (graph: GraphDto): string[] => {
  const {nodes} = graph;
  const errors: string[] = [];

  if (nodes.length > 40000) {
    errors.push('Maximum number of nodes is 40,000.');
  }

  return errors;
};

export const validateEcosystemGraph = (graph: GraphDto) => {
  const validators = [
    checkRootNodeExists,
    checkTotalRootsWeight,
    checkDisconnectedNodes,
    checkForCycles,
    checkInvalidRootEdges,
    checkForDuplicateNodes,
    checkForDuplicateConnections,
    checkForTwoWayEdges,
    checkForMissingNodes,
    checkForOrphanNodes,
    checkMaxNodeCount,
  ];

  const errors = validators.flatMap(validator => validator(graph));

  if (errors.length > 0) {
    throw new ValidationError(
      `Ecosystem graph is not valid:\n${errors.join('\n')}`,
    );
  }
};
