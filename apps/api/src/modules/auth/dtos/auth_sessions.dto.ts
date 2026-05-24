import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { SessionFilters } from '@app/types';

import { BaseFiltersDto } from '../../../common/dtos/base-filters.dto';

export class SessionFiltersDto
  extends BaseFiltersDto
  implements SessionFilters
{
  @ApiPropertyOptional({
    description: 'Filter sessions created after this date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date;
}
