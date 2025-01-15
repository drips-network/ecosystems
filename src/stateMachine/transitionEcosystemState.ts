import {createActor} from 'xstate';
import {Repository} from 'typeorm';
import {Ecosystem} from '../db/entities.ts/Ecosystem';
import {
  EcosystemStateMachineEvent,
  ecosystemStateMachine,
} from './ecosystemStateMachine';

export const transitionEcosystemState = async (
  ecosystem: Ecosystem,
  event: EcosystemStateMachineEvent,
  repository: Repository<Ecosystem>,
): Promise<Ecosystem['state']> => {
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

  await repository.update({id: ecosystem.id}, {state: newState});

  return newState;
};
