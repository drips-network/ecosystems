import {
  ProjectVerificationJobData,
  RateLimitInfo,
} from '../queue/createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import {getRepoDriverId} from '../repoDriver/getRepoDriverId';
import gitHub from '../../../../infrastructure/gitHub';
import {NodeName, ProjectName} from '../../../../domain/types';

export type SuccessfulVerificationResult = {
  success: true;
  repoDriverId: string | null; // `null` for the root node.
  verifiedProjectName: NodeName;
  originalProjectName: NodeName;
};

export type FailedVerificationResult = {
  success: false;
  error: string;
  failedProjectName: ProjectName;
};

export type VerificationResult = {
  rateLimit?: RateLimitInfo;
} & (SuccessfulVerificationResult | FailedVerificationResult);

export const verifyNode = async (
  jobData: ProjectVerificationJobData,
): Promise<VerificationResult> => {
  const {
    node: {projectName},
    chainId,
  } = jobData;

  // Skip verification for the root node.
  if (projectName === 'root') {
    return {
      success: true,
      verifiedProjectName: 'root',
      originalProjectName: 'root',
      repoDriverId: null,
    };
  }

  let latestRateLimit: RateLimitInfo | undefined;

  const [expectedOwner, expectedRepo] = projectName.split('/');

  try {
    const {data, headers} = await gitHub.repos.get({
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

    return {
      success: true,
      verifiedProjectName: verifiedName,
      originalProjectName: projectName as ProjectName,
      rateLimit: latestRateLimit,
      repoDriverId: await getRepoDriverId(chainId, verifiedName),
    };
  } catch (error) {
    logger.error(`Error verifying project '${projectName}':`, error);

    return {
      success: false,
      failedProjectName: projectName as ProjectName,
      rateLimit: latestRateLimit,
      error:
        error instanceof Error
          ? error.message
          : `Unknown error while verifying project '${projectName}'.`,
    };
  }
};
