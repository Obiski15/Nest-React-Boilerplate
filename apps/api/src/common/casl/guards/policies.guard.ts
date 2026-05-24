import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import * as SYSTEM_MESSAGES from '../../../constants/system_messages';
import { IAuthenticatedRequest } from '../../interfaces/auth.interface';
import { CHECK_POLICIES_KEY } from '../decorators/policies.decorator';
import { IPolicyHandler } from '../interfaces/policies.interface';
import { CaslAbilityFactory } from '../services/casl.factory';
import { PolicyHandlerCallback } from '../types/policies.types';

type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext) {
    // Get controller policies
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    // If there are no rules on the route, let it pass
    if (policyHandlers.length === 0) return true;

    // Get the current user from the request context
    const { user } = context.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!user) {
      throw new ForbiddenException(SYSTEM_MESSAGES.UNAUTHORIZED);
    }

    // Build the CASL abilities for this specific user
    const ability = this.caslAbilityFactory.createForUser(user);

    // Evaluate all policies. If any fail, throw a 403 Forbidden
    const isAllowed = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!isAllowed) {
      throw new ForbiddenException(SYSTEM_MESSAGES.FORBIDDEN);
    }

    return true;
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: ReturnType<CaslAbilityFactory['createForUser']>,
  ) {
    if (typeof handler === 'function') {
      return handler(ability);
    }

    return handler.handle(ability);
  }
}
