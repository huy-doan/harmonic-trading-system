// 025. src/shared/constants/pattern-type.enum.ts
export enum PatternType {
    GARTLEY = 'GARTLEY',
    BUTTERFLY = 'BUTTERFLY',
    BAT = 'BAT',
    CRAB = 'CRAB',
    CYPHER = 'CYPHER',
  }
  
  export const PatternTypeDescriptions = {
    [PatternType.GARTLEY]: 'Gartley Pattern',
    [PatternType.BUTTERFLY]: 'Butterfly Pattern',
    [PatternType.BAT]: 'Bat Pattern',
    [PatternType.CRAB]: 'Crab Pattern',
    [PatternType.CYPHER]: 'Cypher Pattern',
  };
  
  export function isValidPatternType(type: string): boolean {
    return Object.values(PatternType).includes(type as PatternType);
  }
  