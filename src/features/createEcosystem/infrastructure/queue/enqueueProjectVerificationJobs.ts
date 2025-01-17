import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';
import {
  ProjectVerificationJobData,
  EcosystemQueue,
} from './createEcosystemQueue';
import {GraphDto} from '../../createEcosystem.dto';

export const enqueueProjectVerificationJobs = async (
  chainId: ChainId,
  ecosystemId: UUID,
  queue: EcosystemQueue,
  graph: GraphDto,
) => {
  const {nodes, edges} = graph;

  const jobsData = new Set<ProjectVerificationJobData>([
    ...nodes.map(node => ({
      node,
      chainId,
      ecosystemId,
      edges: edges.filter(
        edge =>
          edge.source === node.projectName || edge.target === node.projectName,
      ),
    })),
  ]);

  const jobs = Array.from(jobsData).map(
    data =>
      queue
        .createJob(data)
        .retries(20) // Allow up to 20 retries over the 3-hour window.
        .backoff('exponential', 120000) // Base delay factor: 2 minutes.
        .timeout(3 * 60 * 60 * 1000), // Total timeout: 3 hours.
  );

  await queue.saveAll(jobs);

  return jobs.length;
};
