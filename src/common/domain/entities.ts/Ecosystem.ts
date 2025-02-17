import {UUID} from 'crypto';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import {Node} from './Node';
import {AccountId} from '../types';
import {EcosystemState} from '../../infrastructure/stateMachine/ecosystemStateMachine';

@Entity({name: 'Ecosystems'})
export class Ecosystem {
  @PrimaryColumn('uuid')
  public id!: UUID;

  @Column({type: 'varchar', length: 150})
  public name!: string;

  @Column({type: 'varchar', length: 150, nullable: true})
  public description!: string | null;

  @Column({type: 'varchar'})
  public state!: EcosystemState;

  @Column({type: 'varchar', length: 64})
  public chainId!: string;

  @Column({type: 'jsonb'})
  public metadata!: Record<string, unknown>[];

  @Column({type: 'jsonb', nullable: true})
  public error!: string | null;

  @Column({type: 'jsonb'})
  public rawGraph!: Record<string, unknown>;

  @Column({type: 'varchar', length: 200, nullable: true})
  public accountId!: AccountId | null; // The `NftDriver` account ID of the main account for this ecosystem. `null` until the ecosystem is `deployed`.

  @Column({type: 'varchar', length: 42})
  public ownerAddress!: string | null;

  @OneToMany(() => Node, node => node.ecosystem)
  public nodes!: Node[];

  @CreateDateColumn({name: 'createdAt'})
  public createdAt!: Date;

  @UpdateDateColumn({name: 'updatedAt'})
  public updatedAt!: Date;

  @DeleteDateColumn({name: 'deletedAt'})
  public deletedAt: Date | undefined;
}
