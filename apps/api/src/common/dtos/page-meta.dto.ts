// src/common/dtos/page-meta.dto.ts
import { ApiProperty } from '@nestjs/swagger';

import { PageMeta, PageMetaInput } from '@app/types';

export class PageMetaDto implements PageMeta {
  constructor({ total, page, limit }: PageMetaInput) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(this.total / this.limit);
    this.hasNextPage = this.page * this.limit < this.total;
    this.hasPreviousPage = this.page > 1;
  }

  @ApiProperty({ description: 'Total number of items matching the query' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Indicates if there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Indicates if there is a previous page' })
  hasPreviousPage: boolean;
}
