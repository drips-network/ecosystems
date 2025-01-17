import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import {Node} from './Node';
import {Ecosystem} from './Ecosystem';

@Entity({name: 'Edges'})
export class Edge {
  @PrimaryColumn('uuid')
  public sourceNodeId!: string;

  @PrimaryColumn('uuid')
  public targetNodeId!: string;

  @PrimaryColumn('uuid')
  public ecosystemId!: string;

  @ManyToOne(() => Node)
  @JoinColumn({name: 'sourceNodeId'})
  public sourceNode!: Node;

  @ManyToOne(() => Node)
  @JoinColumn({name: 'targetNodeId'})
  public targetNode!: Node;

  @ManyToOne(() => Ecosystem)
  @JoinColumn({name: 'ecosystemId'})
  public ecosystem!: Ecosystem;

  @Column({type: 'decimal'})
  public weight!: number;

  @CreateDateColumn({name: 'createdAt'})
  public createdAt!: Date;

  @UpdateDateColumn({name: 'updatedAt'})
  public updatedAt!: Date;

  @DeleteDateColumn({name: 'deletedAt'})
  public deletedAt: Date | undefined;
}
