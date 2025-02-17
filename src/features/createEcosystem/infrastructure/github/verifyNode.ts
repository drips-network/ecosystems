import {gitHub} from '../../../../common/infrastructure/gitHub';
import {getRepoDriverId} from '../repoDriver/getRepoDriverId';
import {ProjectName, ChainId} from '../../../../common/domain/types';
import assertIsProjectName from '../../../../common/application/assertIsProjectName';

export type SuccessfulNodeVerificationResult = {
  success: true;
  repoDriverId: string | null; // `null` for the root node.
  verifiedProjectName: ProjectName;
  originalProjectName: ProjectName;
};

export type FailedNodeVerificationResult = {
  success: false;
  error: string;
  failedProjectName: ProjectName;
};

export type NodeVerificationResult =
  | SuccessfulNodeVerificationResult
  | FailedNodeVerificationResult;

export type NodeVerificationContext = {
  chainId: ChainId;
  projectName: ProjectName;
};

export default async function verifyNode({
  chainId,
  projectName,
}: NodeVerificationContext): Promise<NodeVerificationResult> {
  if (projectName === 'root') {
    return {
      success: true,
      repoDriverId: null,
      verifiedProjectName: 'root',
      originalProjectName: 'root',
    };
  }

  const [expectedOwner, expectedRepo] = projectName.split('/');

  try {
    const {data, headers} = await (
      await gitHub()
    ).repos.get({
      owner: expectedOwner,
      repo: expectedRepo,
    });

    const latestRateLimit = {
      remaining: Number(headers['x-ratelimit-remaining']),
      resetAt: new Date(Number(headers['x-ratelimit-reset']) * 1000),
      total: Number(headers['x-ratelimit-limit']),
    };

    // If the rate limit is exceeded, throw an error (to eventually retry the job).
    if (latestRateLimit.remaining === 0) {
      throw new Error('GitHub rate limit exceeded.');
    }

    const actualOwner = data.owner.login;
    const actualRepo = data.name;

    const verifiedName = `${actualOwner}/${actualRepo}`;
    assertIsProjectName(verifiedName);

    // If the project was renamed, consider it a failure.
    if (projectName.toLowerCase() !== verifiedName.toLowerCase()) {
      return {
        success: false,
        failedProjectName: projectName,
        error: `${projectName} was renamed to ${verifiedName}`,
      };
    }

    return {
      success: true,
      originalProjectName: projectName,
      verifiedProjectName: verifiedName,
      repoDriverId: await getRepoDriverId(chainId, projectName),
    };
  } catch (error) {
    // If the project was not found, consider it a failure, but a valid result.
    if ((error as {status?: number}).status === 404) {
      return {
        success: false,
        failedProjectName: projectName,
        error: `${projectName} not found.`,
      };
    }

    throw error;
  }
}
