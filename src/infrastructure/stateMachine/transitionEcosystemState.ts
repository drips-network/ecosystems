import {UUID} from 'crypto';
import {createActor} from 'xstate';
import {
  ecosystemStateMachine,
  EcosystemStateMachineEvent,
} from './ecosystemStateMachine';
import {Ecosystem} from '../../domain/entities.ts/Ecosystem';
import {dataSource} from '../datasource';
import {logger} from '../logger';
import unreachable from '../../application/unreachable';

export default async function transitionEcosystemState(
  ecosystemId: UUID,
  event: EcosystemStateMachineEvent,
): Promise<Ecosystem['state']> {
  const repository = dataSource.getRepository(Ecosystem);

  const ecosystem = await repository.findOneBy({id: ecosystemId});

  if (!ecosystem) {
    logger.info(
      `Ecosystem '${ecosystemId}' not found when transitioning state but it should exist.`,
    );

    unreachable('Ecosystem not found');
  }

  const initialState = ecosystemStateMachine.resolveState({
    value: ecosystem.state,
    context: {},
  });

  const actor = createActor(ecosystemStateMachine, {
    state: initialState,
  });

  actor.start();

  actor.send({type: event});

  const newState = actor.getSnapshot().value as Ecosystem['state'];

  logger.info(
    `Ecosystem '${ecosystemId}' transitioned from '${ecosystem.state}' to '${newState}'.`,
  );

  await repository.update({id: ecosystem.id}, {state: newState});

  return newState;
}
