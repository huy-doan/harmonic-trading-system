// 037. src/shared/pipes/validation.pipe.ts
import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
    Logger,
  } from '@nestjs/common';
  import { validate } from 'class-validator';
  import { plainToClass } from 'class-transformer';
  
  @Injectable()
  export class ValidationPipe implements PipeTransform<any> {
    private readonly logger = new Logger(ValidationPipe.name);
  
    async transform(value: any, { metatype }: ArgumentMetadata) {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
      
      // Convert to class instance
      const object = plainToClass(metatype, value);
      
      // Run validation
      const errors = await validate(object);
      
      if (errors.length > 0) {
        const formattedErrors = this.formatErrors(errors);
        
        this.logger.warn(`Validation failed: ${formattedErrors.join(', ')}`);
        
        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      
      return object;
    }
  
    private toValidate(metatype: Function): boolean {
      const types: Function[] = [String, Boolean, Number, Array, Object];
      return !types.includes(metatype);
    }
  
    private formatErrors(errors: any[]): string[] {
      const result = [];
      
      errors.forEach(error => {
        if (error.constraints) {
          Object.values(error.constraints).forEach((constraint: string) => {
            result.push(constraint);
          });
        }
        
        if (error.children && error.children.length) {
          result.push(...this.formatErrors(error.children));
        }
      });
      
      return result;
    }
  }
  