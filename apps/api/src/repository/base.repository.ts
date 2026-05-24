import {
  Brackets,
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { BaseFiltersDto } from '../common/dtos/base-filters.dto';
import { PageMetaDto } from '../common/dtos/page-meta.dto';

export abstract class BaseRepository<
  Entity extends ObjectLiteral,
> extends Repository<Entity> {
  protected entity: EntityTarget<Entity>;

  constructor(
    target: EntityTarget<Entity>,
    protected readonly dataSource: DataSource,
  ) {
    super(target, dataSource.manager);
    this.entity = target;
  }

  protected getRepo(manager?: EntityManager) {
    // If manager exists, we use it, otherwise we use 'this' instance
    return manager
      ? manager.getRepository(this.entity)
      : this.dataSource.getRepository(this.entity);
  }

  protected async paginate(
    queryBuilder: SelectQueryBuilder<Entity>,
    filters: BaseFiltersDto,
    searchColumns: string[] = [],
  ) {
    // Dynamic Global Search using Brackets for SQL safety
    if (filters.search && searchColumns.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          searchColumns.forEach((column, index) => {
            if (index === 0) {
              qb.where(`${column} ILIKE :search`, {
                search: `%${filters.search}%`,
              });
            } else {
              qb.orWhere(`${column} ILIKE :search`, {
                search: `%${filters.search}%`,
              });
            }
          });
        }),
      );
    }

    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute Query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: new PageMetaDto({ total, page, limit }),
    };
  }
}
