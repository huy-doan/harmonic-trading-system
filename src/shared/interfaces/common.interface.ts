// 015. src/shared/interfaces/common.interface.ts
export interface BaseInterface {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface PaginationResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
  }
  
  export interface PaginationOptions {
    page: number;
    limit: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }