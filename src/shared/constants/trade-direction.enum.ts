// 027. src/shared/constants/trade-direction.enum.ts
export enum TradeDirection {
    LONG = 'LONG',
    SHORT = 'SHORT',
  }
  
  export const TradeDirectionDescriptions = {
    [TradeDirection.LONG]: 'Buy (Long Position)',
    [TradeDirection.SHORT]: 'Sell (Short Position)',
  };
  
  export function isValidTradeDirection(direction: string): boolean {
    return Object.values(TradeDirection).includes(direction as TradeDirection);
  }
  
  export function getOppositeDirection(direction: TradeDirection): TradeDirection {
    return direction === TradeDirection.LONG ? TradeDirection.SHORT : TradeDirection.LONG;
  }
  