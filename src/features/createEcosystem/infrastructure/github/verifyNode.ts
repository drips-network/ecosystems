import {gitHub} from '../../../../common/infrastructure/gitHub';
import {
  ProjectName,
  ChainId,
  OxString,
  AccountId,
} from '../../../../common/domain/types';
import {assertIsProjectName} from '../../../../common/application/assertions';
import {
  executeRepoDriverReadMethod,
  Forge,
} from '../../../../common/infrastructure/contracts/repoDriver/repoDriver';
import {hexlify, toUtf8Bytes} from 'ethers';
import {config} from '../../../../config/configLoader';

export type SuccessfulNodeVerificationResult = {
  success: true;
  url: string;
  verifiedProjectName: ProjectName;
  originalProjectName: ProjectName;
  repoDriverId: AccountId;
};

export type FailedNodeVerificationResult = {
  success: false;
  originalProjectName: ProjectName;
  error: string;
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
      verifiedProjectName: 'root',
      originalProjectName: 'root',
      repoDriverId: 'N/A',
      url: 'N/A',
    };
  }

  const [expectedOwner, expectedRepo] = projectName.split('/');

  if (config.disableGitHubValidation) {
    const repoDriverId = (
      await executeRepoDriverReadMethod({
        functionName: 'calcAccountId',
        args: [
          Forge.GitHub,
          hexlify(toUtf8Bytes(`${projectName}`)) as OxString,
        ],
        chainId,
      })
    ).toString() as AccountId;

    return {
      success: true,
      url: `https://github.com/${expectedOwner}/${expectedRepo}`,
      originalProjectName: projectName,
      verifiedProjectName: projectName,
      repoDriverId,
    };
  }

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

    const url = `https://github.com/${actualOwner}/${actualRepo}`;

    // If the project was renamed, consider it a failure.
    if (projectName.toLowerCase() !== verifiedName.toLowerCase()) {
      return {
        success: false,
        originalProjectName: projectName,
        error: `${projectName} was renamed to ${verifiedName}`,
      };
    }

    const repoDriverId = (
      await executeRepoDriverReadMethod({
        functionName: 'calcAccountId',
        args: [
          Forge.GitHub,
          hexlify(toUtf8Bytes(`${verifiedName}`)) as OxString,
        ],
        chainId,
      })
    ).toString() as AccountId;

    return {
      success: true,
      url,
      originalProjectName: projectName,
      verifiedProjectName: verifiedName,
      repoDriverId,
    };
  } catch (error) {
    // If the project was not found, consider it a failure, but a valid result.
    if ((error as {status?: number}).status === 404) {
      return {
        success: false,
        originalProjectName: projectName,
        error: `${projectName} not found.`,
      };
    }

    throw error;
  }
}
