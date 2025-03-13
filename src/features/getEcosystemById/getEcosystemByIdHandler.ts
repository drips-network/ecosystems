import {
  GetEcosystemByIdRequestDto,
  GetEcosystemByIdResponseDto,
} from './getEcosystemByIdDto';
import {getEcosystemWithNodesAndEdgesById} from './getEcosystemWithNodesAndEdgesById';
import {assertIsUUID} from '../../common/application/assertions';

export const handleGetEcosystemById = async (
  request: GetEcosystemByIdRequestDto,
): Promise<GetEcosystemByIdResponseDto> => {
  const {id} = request;
  assertIsUUID(id);

  const {ecosystem, edges} = await getEcosystemWithNodesAndEdgesById(id);

  return {
    id: ecosystem.id,
    state: ecosystem.state,
    accountId: ecosystem.accountId,
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
        source: edge.sourceNode.projectAccountId,
        target: edge.targetNode.projectAccountId,
        weight: edge.weight,
      })),
    },
  };
};
