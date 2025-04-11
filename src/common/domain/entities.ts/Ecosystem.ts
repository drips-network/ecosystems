import {UUID} from 'crypto';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import {Node} from './Node';
import {AccountId, ChainId, OxString} from '../types';
import {EcosystemState} from '../../infrastructure/stateMachine/ecosystemStateMachine';

type EmojiAvatar = {
  type: 'emoji';
  emoji: string;
};

@Entity({name: 'Ecosystems'})
@Check(
  '(public."Ecosystems"."state" <> \'deployed\' OR public."Ecosystems"."accountId" IS NOT NULL)',
)
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
  public chainId!: ChainId;

  @Column({type: 'jsonb'})
  public metadata!: Record<string, unknown>[];

  @Column({type: 'jsonb', nullable: true})
  public error!: string | null;

  @Column({type: 'jsonb'})
  public rawGraph!: Record<string, unknown>;

  @Column({type: 'varchar', length: 200, nullable: true})
  public accountId!: AccountId | null; // The `NftDriver` account ID of the main account for this ecosystem. `null` until the ecosystem is `deployed`.

  @Column({type: 'varchar', length: 42})
  public ownerAddress!: OxString;

  @OneToMany(() => Node, node => node.ecosystem)
  public nodes!: Node[];

  @Column({type: 'json'})
  public avatar!: EmojiAvatar;

  @CreateDateColumn({name: 'createdAt'})
  public createdAt!: Date;

  @UpdateDateColumn({name: 'updatedAt'})
  public updatedAt!: Date;

  @DeleteDateColumn({name: 'deletedAt'})
  public deletedAt: Date | undefined;

  @Column({type: 'varchar', length: 9})
  color!: string;
}
