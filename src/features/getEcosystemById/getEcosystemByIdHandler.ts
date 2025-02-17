import {UUID} from 'crypto';
import {
  GetEcosystemByIdRequestDto,
  GetEcosystemByIdResponseDto,
} from './getEcosystemByIdDto';
import {getEcosystemWithNodesAndEdgesById} from './getEcosystemWithNodesAndEdgesById';

export const handleGetEcosystemById = async (
  request: GetEcosystemByIdRequestDto,
): Promise<GetEcosystemByIdResponseDto> => {
  const {ecosystem, edges} = await getEcosystemWithNodesAndEdgesById(
    request.id as UUID,
  );

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
