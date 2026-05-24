import { AppAbility } from '../types/casl.types';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}
