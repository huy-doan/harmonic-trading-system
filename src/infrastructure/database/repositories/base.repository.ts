// 051. src/infrastructure/database/repositories/base.repository.ts
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { BaseInterface, PaginationOptions, PaginationResult } from '@shared/interfaces/common.interface';
import { BaseRepository } from '@shared/interfaces/repository.interface';

export abstract class AbstractBaseRepository<T extends BaseInterface> implements BaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: PaginationOptions): Promise<PaginationResult<T>> {
    const defaultOptions: PaginationOptions = {
      page: 1,
      limit: 10,
      sort: 'createdAt',
      order: 'DESC',
      ...options,
    };

    const skip = (defaultOptions.page - 1) * defaultOptions.limit;

    const [items, total] = await this.repository.findAndCount({
      skip,
      take: defaultOptions.limit,
      order: {
        [defaultOptions.sort]: defaultOptions.order,
      } as any,
    });

    return {
      items,
      total,
      page: defaultOptions.page,
      limit: defaultOptions.limit,
    };
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async findOne(conditions: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where: conditions });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}
