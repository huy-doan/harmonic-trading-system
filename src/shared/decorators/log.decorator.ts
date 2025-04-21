// 029. src/shared/decorators/log.decorator.ts
import { Logger } from '@nestjs/common';

export function Log(message?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const logMessage = message || `${propertyKey} execution`;
      
      logger.debug(`${logMessage} started`);
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        logger.debug(`${logMessage} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`${logMessage} failed after ${duration}ms`, error.stack);
        throw error;
      }
    };

    return descriptor;
  };
}

export function LogExecutionTime() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const start = process.hrtime();
      
      const result = await originalMethod.apply(this, args);
      
      const end = process.hrtime(start);
      const duration = end[0] * 1000 + end[1] / 1000000;
      
      logger.log(`${propertyKey} executed in ${duration.toFixed(2)}ms`);
      
      return result;
    };

    return descriptor;
  };
}
