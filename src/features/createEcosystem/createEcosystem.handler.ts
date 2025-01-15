import {Repository} from 'typeorm';
import {Ecosystem} from '../../db/entities.ts/Ecosystem';
import {
  CreateNewEcosystemRequestDto,
  CreateNewEcosystemResponseDto,
} from './createEcosystem.dto';
import {transitionEcosystemState} from '../../stateMachine/transitionEcosystemState';
import {Logger} from 'winston';

export const handleCreateEcosystem = async (
  newEcosystemDto: CreateNewEcosystemRequestDto,
  repository: Repository<Ecosystem>,
  logger: Logger,
): Promise<CreateNewEcosystemResponseDto> => {
  const ecosystemEntityToSave = repository.create({
    ...newEcosystemDto,
    state: 'processing_upload', // Initial state
  });
  const createdEcosystemEntity = await repository.save(ecosystemEntityToSave);

  try {
    await verifyProjectsOnGh(newEcosystemDto.graph);

    // Transition to `pending_deployment` state
    await transitionEcosystemState(
      createdEcosystemEntity,
      'UPLOAD_SUCCESS',
      repository,
    );
  } catch (error) {
    logger.error('Failed to verify projects on GitHub for ecosystem: ', error);

    // Transition to `error` state
    await transitionEcosystemState(
      createdEcosystemEntity,
      'UPLOAD_FAILURE',
      repository,
    );

    throw new Error('Failed to create ecosystem.');
  }

  return {id: createdEcosystemEntity.id, state: createdEcosystemEntity.state};
};

const verifyProjectsOnGh = async (
  graph: CreateNewEcosystemRequestDto['graph'],
) => {
  console.log('Checking projects on GitHub');
};
