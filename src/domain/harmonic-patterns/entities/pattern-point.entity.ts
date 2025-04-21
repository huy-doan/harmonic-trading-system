// 092. src/domain/harmonic-patterns/entities/pattern-point.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';

@Entity('pattern_points')
export class PatternPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  label: string; // X, A, B, C, D

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'fibonacci_ratio' })
  fibonacciRatio: number;

  @Column({ type: 'boolean', default: false, name: 'is_predicted' })
  isPredicted: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'uuid', name: 'pattern_id' })
  patternId: string;

  @ManyToOne(() => HarmonicPattern, (pattern) => pattern.points)
  @JoinColumn({ name: 'pattern_id' })
  pattern: HarmonicPattern;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
