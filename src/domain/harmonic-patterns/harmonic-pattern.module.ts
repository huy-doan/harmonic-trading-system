// 104. src/domain/harmonic-patterns/harmonic-pattern.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { HarmonicPattern } from './entities/harmonic-pattern.entity';
import { PatternPoint } from './entities/pattern-point.entity';

// Services
import { GartleyPatternService } from './services/gartley-pattern.service';
import { ButterflyPatternService } from './services/butterfly-pattern.service';
import { BatPatternService } from './services/bat-pattern.service';
import { CrabPatternService } from './services/crab-pattern.service';
import { CypherPatternService } from './services/cypher-pattern.service';
import { PointPredictorService } from './services/point-predictor.service';

// Controllers
import { HarmonicPatternController } from './controllers/harmonic-pattern.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([HarmonicPattern, PatternPoint]),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    GartleyPatternService,
    ButterflyPatternService,
    BatPatternService,
    CrabPatternService,
    CypherPatternService,
    PointPredictorService,
  ],
  controllers: [
    HarmonicPatternController,
  ],
  exports: [
    GartleyPatternService,
    ButterflyPatternService,
    BatPatternService,
    CrabPatternService,
    CypherPatternService,
    PointPredictorService,
  ],
})
export class HarmonicPatternModule {}
