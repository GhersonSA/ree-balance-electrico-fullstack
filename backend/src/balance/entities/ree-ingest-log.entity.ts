import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type IngestStatus = 'success' | 'error';

@Entity('ree_ingest_logs')
@Index('idx_ree_ingest_logs_fetched_at', ['fetchedAt'])
export class ReeIngestLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz' })
  requestStart!: Date;

  @Column({ type: 'timestamptz' })
  requestEnd!: Date;

  @Column({ type: 'varchar', length: 20 })
  timeTrunc!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: IngestStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fetchedAt!: Date;
}
