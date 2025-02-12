import {UUID} from 'crypto';
import unreachable from '../../../../application/unreachable';
import {dataSource} from '../../../../infrastructure/datasource';
import {Ecosystem} from '../../../../domain/entities.ts/Ecosystem';

export default async function saveError(ecosystemId: UUID, error: string) {
  const repository = dataSource.getRepository(Ecosystem);

  const ecosystem = await repository.findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    unreachable(`Ecosystem '${ecosystemId}' not found.`);
  }

  ecosystem.error = error;

  await repository.save(ecosystem);
}
