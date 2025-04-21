// 028. src/shared/decorators/validate.decorator.ts
import { applyDecorators, SetMetadata, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation } from '@nestjs/swagger';

export const VALIDATION_OPTIONS_KEY = 'validation:options';

export interface ValidationOptions {
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  groups?: string[];
}

export function Validate(options: ValidationOptions = {}) {
  const defaultOptions: ValidationOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    ...options,
  };

  return applyDecorators(
    SetMetadata(VALIDATION_OPTIONS_KEY, defaultOptions),
    UsePipes(new ValidationPipe(defaultOptions)),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}

export function ValidateGroups(...groups: string[]) {
  return Validate({ groups });
}

export function ValidateTransform() {
  return Validate({ transform: true });
}
