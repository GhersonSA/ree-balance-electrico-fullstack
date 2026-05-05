import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('balance_points')
@Unique('uq_balance_point_ts_type_trunc', [
  'timestamp',
  'indicatorType',
  'timeTrunc',
])
@Index('idx_balance_point_timestamp', ['timestamp'])
@Index('idx_balance_point_indicator_type', ['indicatorType'])
export class BalancePoint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'varchar', length: 120 })
  indicatorType!: string;

  @Column({ type: 'varchar', length: 180 })
  indicatorName!: string;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  value!: string;

  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true })
  percentage?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  unit?: string | null;

  @Column({ type: 'varchar', length: 20 })
  timeTrunc!: string;

  @Column({ type: 'varchar', length: 30, default: 'ree' })
  source!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
