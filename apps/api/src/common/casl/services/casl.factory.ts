import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from '@casl/ability';

import type { AuthJwtPayload } from '@app/types';
import { UserRole } from '@app/types';

import { UserEntity } from '../../../modules/user/entities/user.entity';
import { Action } from '../enums/casl.enum';
import { AppAbility, Subjects } from '../types/casl.types';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthJwtPayload): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    if (user.role === UserRole.ADMIN) {
      can(Action.MANAGE, 'all');
    } else {
      // user entities

      // ONLY read if the IDs match
      can(Action.READ_SELF, UserEntity, { id: user.sub });

      // ONLY update if the IDs match
      can(Action.UPDATE_SELF, UserEntity, { id: user.sub });

      // ONLY delete if the IDs match
      can(Action.DELETE_SELF, UserEntity, { id: user.sub });

      // Admins only
      cannot(Action.READ_USER, UserEntity).because(
        'Only admins can read individual user details',
      );

      cannot(Action.UPDATE_USER, UserEntity).because(
        'Only admins can update user accounts',
      );

      cannot(Action.DELETE_USER, UserEntity).because(
        'Only admins can delete accounts',
      );

      cannot(Action.READ_USERS, UserEntity).because(
        'Only admins can read all users',
      );

      // other permissions for non-admin users can be defined here
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
