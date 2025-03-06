import {UUID} from 'crypto';
import {EdgeDto, GraphDto, NodeDto} from '../../api/createEcosystemDtos';
import {ChainId} from '../../../../common/domain/types';
import BeeQueue from 'bee-queue';
import {logger} from '../../../../common/infrastructure/logger';

export type ProjectVerificationJobData = {
  node: NodeDto;
  edges: EdgeDto[];
  chainId: ChainId;
  ecosystemId: UUID;
  totalJobs: number;
};

export const enqueueProjectVerificationJobs = async (
  queue: BeeQueue<ProjectVerificationJobData>,
  graph: GraphDto,
  chainId: ChainId,
  ecosystemId: UUID,
) => {
  const {nodes, edges} = graph;

  const jobsData = new Set<ProjectVerificationJobData>([
    ...nodes.map(node => ({
      node,
      chainId,
      ecosystemId,
      totalJobs: nodes.length,
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

  logger.info(
    `Enqueued ${jobs.length} project verification jobs for ecosystem '${ecosystemId}'.`,
  );
};
