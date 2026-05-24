import { InferSubjects, MongoAbility } from '@casl/ability';

import { UserEntity } from '../../../modules/user/entities/user.entity';
import { Action } from '../enums/casl.enum';

// Entities CASL is allowed to check
export type Subjects = InferSubjects<typeof UserEntity> | 'all';

// Define specific Ability type
export type AppAbility = MongoAbility<[Action, Subjects]>;
