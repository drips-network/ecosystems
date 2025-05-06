import {
  GetEcosystemByIdRequestDto,
  GetEcosystemByIdResponseDto,
} from './getEcosystemByIdDto';
import {getEcosystemWithNodesAndEdgesById} from './getEcosystemWithNodesAndEdgesById';

export const handleGetEcosystemById = async (
  request: GetEcosystemByIdRequestDto,
): Promise<GetEcosystemByIdResponseDto> => {
  const {id} = request;
  const {ecosystem, edges} = await getEcosystemWithNodesAndEdgesById(id);

  return {
    id: ecosystem.id,
    state: ecosystem.state,
    accountId: ecosystem.accountId,
    ownerAddress: ecosystem.ownerAddress,
    name: ecosystem.name,
    description: ecosystem.description,
    metadata: ecosystem.metadata as GetEcosystemByIdResponseDto['metadata'],
    avatar: ecosystem.avatar,
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
        source:
          edge.sourceNode.projectName === 'root'
            ? 'root'
            : edge.sourceNode.projectAccountId,
        target: edge.targetNode.projectAccountId,
        weight: edge.weight,
      })),
    },
    color: ecosystem.color,
  };
};
