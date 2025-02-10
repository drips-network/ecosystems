import {createMachine} from 'xstate';

export type EcosystemStateMachineEvent =
  | 'PROCESSING_COMPLETED'
  | 'PROCESSING_FAILED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_COMPLETED'
  | 'DEPLOYMENT_FAILED';

export const ECOSYSTEM_STATES = [
  'processing_graph',
  'pending_deployment',
  'deploying',
  'deployed',
  'error',
] as const;

export type EcosystemState = (typeof ECOSYSTEM_STATES)[number];

export const ecosystemStateMachine = createMachine({
  id: 'ecosystem',
  initial: 'processing_graph',
  states: {
    processing_graph: {
      on: {
        PROCESSING_COMPLETED: 'pending_deployment',
        PROCESSING_FAILED: 'error',
      },
    },
    pending_deployment: {
      on: {DEPLOYMENT_STARTED: 'deploying', DEPLOYMENT_FAILED: 'error'},
    },
    deploying: {
      on: {DEPLOYMENT_COMPLETED: 'deployed', DEPLOYMENT_FAILED: 'error'},
    },
    deployed: {
      type: 'final',
    },
    error: {},
  },
});
