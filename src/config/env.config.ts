// 006. src/config/env.config.ts
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  API_PORT: number;

  @IsString()
  API_HOST: string;

  @IsString()
  API_PREFIX: string;

  @IsString()
  API_VERSION: string;

  @IsString()
  POSTGRES_HOST: string;

  @IsNumber()
  POSTGRES_PORT: number;

  @IsString()
  POSTGRES_USER: string;

  @IsString()
  POSTGRES_PASSWORD: string;

  @IsString()
  POSTGRES_DB: string;

  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsString()
  @IsOptional()
  JWT_SECRET: string;

  @IsNumber()
  @IsOptional()
  JWT_EXPIRATION: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      NODE_ENV: process.env.NODE_ENV,
      API_PORT: parseInt(process.env.API_PORT, 10),
      API_HOST: process.env.API_HOST,
      API_PREFIX: process.env.API_PREFIX,
      API_VERSION: process.env.API_VERSION,
      POSTGRES_HOST: process.env.POSTGRES_HOST,
      POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT, 10),
      POSTGRES_USER: process.env.POSTGRES_USER,
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
      POSTGRES_DB: process.env.POSTGRES_DB,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRATION: process.env.JWT_EXPIRATION ? parseInt(process.env.JWT_EXPIRATION, 10) : undefined,
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  
  return validatedConfig;
}
