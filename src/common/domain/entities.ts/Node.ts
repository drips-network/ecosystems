import {UUID} from 'crypto';
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import {Ecosystem} from './Ecosystem';
import {AccountId, ProjectName} from '../types';
import {Edge} from './Edge';
import {numericTransformer} from '../numericTransformer';

@Index('ecosystem', ['ecosystem'])
@Entity({name: 'Nodes'})
export class Node {
  @PrimaryGeneratedColumn('uuid')
  public id!: UUID;

  @ManyToOne(() => Ecosystem)
  public ecosystem!: Ecosystem;

  @OneToMany(() => Edge, edge => edge.sourceNode)
  public outgoingEdges!: Edge[];

  @OneToMany(() => Edge, edge => edge.targetNode)
  public incomingEdges!: Edge[];

  @Column({type: 'varchar', length: 200})
  public projectName!: ProjectName;

  @Column({type: 'varchar', length: 200, nullable: true})
  public url!: string | null;

  @Column({type: 'varchar', length: 200, nullable: true})
  public projectAccountId!: AccountId | null; // The `RepoDriver` account ID.

  @Column({type: 'varchar', length: 200})
  public originalProjectName!: ProjectName;

  @Column({type: 'decimal', transformer: numericTransformer})
  public absoluteWeight!: number;

  @CreateDateColumn({name: 'createdAt'})
  public createdAt!: Date;

  @UpdateDateColumn({name: 'updatedAt'})
  public updatedAt!: Date;

  @DeleteDateColumn({name: 'deletedAt'})
  public deletedAt: Date | undefined;
}
