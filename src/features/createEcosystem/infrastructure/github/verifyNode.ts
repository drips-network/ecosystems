import {RateLimitInfo} from '../queue/createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import {getRepoDriverId} from '../repoDriver/getRepoDriverId';
import {ChainId, NodeName, ProjectName} from '../../../../domain/types';
import {gitHub} from '../../../../infrastructure/gitHub';

export type SuccessfulNodeVerificationResult = {
  success: true;
  repoDriverId: string | null; // `null` for the root node.
  verifiedProjectName: NodeName;
  originalProjectName: NodeName;
};

export type FailedNodeVerificationResult = {
  success: false;
  error: string;
  failedProjectName: ProjectName;
};

export type NodeVerificationResult =
  | SuccessfulNodeVerificationResult
  | FailedNodeVerificationResult;

export const verifyNode = async (
  name: NodeName,
  chainId: ChainId,
): Promise<NodeVerificationResult> => {
  // Skip verification for the root node.
  if (name === 'root') {
    return {
      success: true,
      repoDriverId: null,
      verifiedProjectName: 'root',
      originalProjectName: 'root',
    };
  }

  let latestRateLimit: RateLimitInfo | undefined;
  const [expectedOwner, expectedRepo] = name.split('/');

  try {
    const {data, headers} = await (
      await gitHub()
    ).repos.get({
      owner: expectedOwner,
      repo: expectedRepo,
    });

    latestRateLimit = {
      remaining: Number(headers['x-ratelimit-remaining']),
      resetAt: new Date(Number(headers['x-ratelimit-reset']) * 1000),
      total: Number(headers['x-ratelimit-limit']),
    };

    logger.info('GitHub API rate limit:', {
      remaining: latestRateLimit.remaining,
      resetAt: latestRateLimit.resetAt,
      total: latestRateLimit.total,
    });

    const actualOwner = data.owner.login;
    const actualRepo = data.name;

    const verifiedName = `${actualOwner}/${actualRepo}` as ProjectName;

    if (name.toLowerCase() !== verifiedName.toLowerCase()) {
      throw new Error(`Project '${name}' was renamed to '${verifiedName}'.`);
    }

    return {
      success: true,
      originalProjectName: name,
      verifiedProjectName: verifiedName,
      repoDriverId: await getRepoDriverId(chainId, verifiedName),
    };
  } catch (error) {
    logger.error(`Error verifying project '${name}':`, error);

    return {
      success: false,
      failedProjectName: name,
      error:
        error instanceof Error
          ? error.message
          : `Error verifying project '${name}'.`,
    };
  }
};
