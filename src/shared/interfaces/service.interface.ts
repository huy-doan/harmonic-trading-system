// 018. src/shared/interfaces/service.interface.ts
import { DeepPartial } from 'typeorm';
import { PaginationOptions, PaginationResult } from './common.interface';

export interface BaseService<T> {
  findAll(options?: PaginationOptions): Promise<PaginationResult<T>>;
  findById(id: string): Promise<T | null>;
  create(data: DeepPartial<T>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
