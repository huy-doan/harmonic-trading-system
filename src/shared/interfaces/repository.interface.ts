// 017. src/shared/interfaces/repository.interface.ts
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { PaginationOptions, PaginationResult } from './common.interface';

export interface BaseRepository<T> {
  findAll(options?: PaginationOptions): Promise<PaginationResult<T>>;
  findById(id: string): Promise<T | null>;
  findOne(conditions: FindOptionsWhere<T>): Promise<T | null>;
  create(data: DeepPartial<T>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  getRepository(): Repository<T>;
}
