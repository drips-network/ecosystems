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
import {AccountId, NodeName} from '../types';
import {Edge} from './Edge';

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
  public projectName!: NodeName;

  @Column({type: 'varchar', length: 200, nullable: true})
  public repoDriverId!: AccountId | null;

  @Column({type: 'varchar', length: 200})
  public originalProjectName!: NodeName;

  @CreateDateColumn({name: 'createdAt'})
  public createdAt!: Date;

  @UpdateDateColumn({name: 'updatedAt'})
  public updatedAt!: Date;

  @DeleteDateColumn({name: 'deletedAt'})
  public deletedAt: Date | undefined;
}
