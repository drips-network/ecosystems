import {createMachine} from 'xstate';

export type EcosystemStateMachineEvent =
  | 'UPLOAD_SUCCESS'
  | 'UPLOAD_FAILURE'
  | 'APPROVE'
  | 'DEPLOY_SUCCESS'
  | 'DEPLOY_FAILURE';

export const ecosystemStateMachine = createMachine({
  id: 'ecosystem',
  initial: 'processing_upload',
  states: {
    processing_upload: {
      on: {UPLOAD_SUCCESS: 'pending_deployment', UPLOAD_FAILURE: 'error'},
    },
    pending_deployment: {
      on: {APPROVE: 'deploying', REJECT: 'error'},
    },
    deploying: {
      on: {DEPLOY_SUCCESS: 'deployed', DEPLOY_FAILURE: 'error'},
    },
    deployed: {
      type: 'final',
    },
    error: {},
  },
});
