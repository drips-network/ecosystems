import {Octokit} from '@octokit/rest';
import {config} from './config/configLoader';

const gitHub = new Octokit({auth: config.gitHubToken});

export default gitHub;
