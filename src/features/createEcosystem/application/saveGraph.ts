import {UUID} from 'crypto';
import {SuccessfulProcessingResult} from '../infrastructure/redis/loadProcessingResultsFromRedis';
import {dataSource} from '../../../common/infrastructure/datasource';
import {
  getEcosystemById,
  saveEdges,
  saveNodes,
  updateNodesWithAbsolutePercentages,
} from '../infrastructure/database/ecosystemRepository';
import {logger} from '../../../common/infrastructure/logger';
import {calculateAbsolutePercentages} from '../domain/calculateAbsolutePercentages';

export default async function saveGraph(
  ecosystemId: UUID,
  successfulResults: SuccessfulProcessingResult[],
) {
  await dataSource.transaction(async manager => {
    const ecosystem = await getEcosystemById(ecosystemId, manager);
    const nodes = await saveNodes(ecosystem, successfulResults, manager);
    const edges = await saveEdges(successfulResults, ecosystem, nodes, manager);

    const computedPercentages = await calculateAbsolutePercentages(
      nodes,
      edges,
    );
    await updateNodesWithAbsolutePercentages(
      nodes,
      computedPercentages,
      manager,
    );
  });

  logger.info(
    `Successfully saved nodes, edges, and computed percentages for ecosystem '${ecosystemId}'.`,
  );
}
