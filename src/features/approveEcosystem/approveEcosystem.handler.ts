import {Repository} from 'typeorm';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {NotFoundError} from '../../errors/HttpError';
import {UUID} from 'crypto';
import {transitionEcosystemState} from '../../stateMachine/transitionEcosystemState';
import {Logger} from 'winston';
import unreachable from '../../errors/unreachable';

export const handleApproveEcosystem = async (
  ecosystemId: UUID,
  repository: Repository<Ecosystem>,
  logger: Logger,
) => {
  let ecosystem = await repository.findOneBy({id: ecosystemId as UUID});
  if (!ecosystem) {
    throw new NotFoundError('Ecosystem not found');
  }

  try {
    // Transition to `deploying` state.
    await transitionEcosystemState(ecosystem, 'APPROVE', repository);

    await deployEcosystem(ecosystemId);

    // Refetch ecosystem to ensure we have latest state.
    ecosystem = await repository.findOneBy({id: ecosystemId as UUID});
    if (!ecosystem) {
      unreachable(`Ecosystem '${ecosystemId}' disappeared during deployment!`);
    }

    // Transition to `deployed` state.
    await transitionEcosystemState(ecosystem, 'DEPLOY_SUCCESS', repository);
  } catch (error) {
    // Refetch again to ensure we have latest state.
    ecosystem = await repository.findOneBy({id: ecosystemId as UUID});
    if (!ecosystem) {
      unreachable(
        `Ecosystem '${ecosystemId}' disappeared during error handling!`,
      );
    }

    logger.error('Failed to deploy ecosystem: ', error);

    // Transition to `error` state.
    await transitionEcosystemState(ecosystem, 'DEPLOY_FAILURE', repository);

    throw new Error('Failed to deploy ecosystem.');
  }
};

const deployEcosystem = async (ecosystemId: string) => {
  console.log('Deploying ecosystem', ecosystemId);
};
