// 038. src/shared/pipes/parse-int.pipe.ts
import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
  } from '@nestjs/common';
  
  @Injectable()
  export class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number {
      const val = parseInt(value, 10);
      
      if (isNaN(val)) {
        throw new BadRequestException(
          `Parameter ${metadata.data} must be a valid integer`,
        );
      }
      
      return val;
    }
  }
  
  @Injectable()
  export class ParsePositiveIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number {
      const val = parseInt(value, 10);
      
      if (isNaN(val)) {
        throw new BadRequestException(
          `Parameter ${metadata.data} must be a valid integer`,
        );
      }
      
      if (val <= 0) {
        throw new BadRequestException(
          `Parameter ${metadata.data} must be a positive integer`,
        );
      }
      
      return val;
    }
  }
  
  @Injectable()
  export class ParseIntWithDefaultPipe implements PipeTransform<string, number> {
    constructor(private readonly defaultValue: number) {}
  
    transform(value: string): number {
      if (value === undefined || value === null || value === '') {
        return this.defaultValue;
      }
      
      const val = parseInt(value, 10);
      
      if (isNaN(val)) {
        return this.defaultValue;
      }
      
      return val;
    }
  }
  