import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, FindOneOptions } from 'typeorm';

import { BaseRepository } from '../../../repository/base.repository';
import { UserFiltersDto } from '../dtos/user.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  async findAll({
    filters,
    manager,
  }: {
    filters: UserFiltersDto;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);
    const queryBuilder = repo.createQueryBuilder('user');

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', {
        role: filters.role,
      });
    }

    // Checking for undefined to filter strictly for false values if needed
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere('user.is_active = :is_active', {
        is_active: filters.is_active,
      });
    }

    if (filters.is_email_verified !== undefined) {
      queryBuilder.andWhere('user.is_email_verified = :is_email_verified', {
        is_email_verified: filters.is_email_verified,
      });
    }

    return await this.paginate(queryBuilder, filters, [
      'user.name',
      'user.email',
    ]);
  }

  async findByEmail({
    email,
    options = {},
    manager,
  }: {
    email: string;
    options?: FindOneOptions<UserEntity>;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);
    return repo.findOne({
      ...options,
      where: { ...options.where, email },
    });
  }

  async findById({
    id,
    options = {},
    manager,
  }: {
    id: string;
    options?: FindOneOptions<UserEntity>;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);
    return repo.findOne({
      ...options,
      where: { ...options.where, id },
    });
  }

  async createUser(userDto: Partial<UserEntity>, manager?: EntityManager) {
    const repo = this.getRepo(manager);
    const userEntity = repo.create(userDto);
    return repo.save(userEntity);
  }

  async updateUser(
    id: string,
    data: Partial<UserEntity>,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    // TypeORM's preload gracefully handles fetching the existing entity
    // and merging the new data into it without manual iteration.
    const user = await repo.preload({
      id,
      ...data,
    });

    if (!user) {
      return null;
    }

    return repo.save(user);
  }

  async softDeleteUser(id: string, manager?: EntityManager) {
    const repo = this.getRepo(manager);
    await repo.softDelete(id);
  }
}
