import {UUID} from 'crypto';
import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

export type EcosystemState =
  | 'processing_upload'
  | 'pending_deployment'
  | 'deploying'
  | 'deployed'
  | 'error';

@Entity({name: 'Ecosystems'})
export class Ecosystem {
  @PrimaryGeneratedColumn('uuid')
  id!: UUID;

  @Column({type: 'varchar', length: 150})
  name!: string;

  @Column({type: 'varchar', default: 'processing_upload'})
  state!: EcosystemState;
}
