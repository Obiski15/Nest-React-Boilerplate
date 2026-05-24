import { Action } from '../../../common/casl/enums/casl.enum';
import { IPolicyHandler } from '../../../common/casl/interfaces/policies.interface';
import { AppAbility } from '../../../common/casl/types/casl.types';
import { UserEntity } from '../entities/user.entity';

export class ReadSelfPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.READ_SELF, UserEntity);
  }
}

export class UpdateSelfPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.UPDATE_SELF, UserEntity);
  }
}

export class DeleteSelfPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.DELETE_SELF, UserEntity);
  }
}

export class ReadUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.READ_USER, UserEntity);
  }
}

export class ReadUsersPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.READ_USERS, UserEntity);
  }
}

export class DeleteUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.DELETE_USER, UserEntity);
  }
}

export class UpdateUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.UPDATE_USER, UserEntity);
  }
}
