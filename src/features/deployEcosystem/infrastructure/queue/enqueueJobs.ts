import {ChainId, OxString} from '../../../../common/domain/types';
import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {logger} from '../../../../common/infrastructure/logger';
import {SubList} from '../../application/batchSubLists';
import {ProjectReceiver} from '../../application/types';

export type SubListsBatchJobData = {
  chainId: ChainId;
  totalTxs: number;
  ecosystemId: UUID;
  subList: SubList;
  ownerAddress: OxString;
};

type Params = {
  chainId: ChainId;
  ecosystemId: UUID;
  ownerAddress: OxString;
  subListBatches: SubList[][];
  queue: BeeQueue<SubListsBatchJobData>;
};

export async function enqueueJobs({
  queue,
  chainId,
  ecosystemId,
  ownerAddress,
  subListBatches,
}: Params) {
  const jobs = subListBatches
    .flatMap(subLists => subLists)
    .map(r =>
      queue
        .createJob({
          chainId,
          subList: r,
          ownerAddress,
          ecosystemId,
          totalTxs: subListBatches.length,
        })
        .retries(0),
    );

  await queue.saveAll(jobs);

  logger.info(
    `Enqueued ${jobs.length} Immutable Splits creation job(s) for ecosystem '${ecosystemId}'.`,
  );
}
