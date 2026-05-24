import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CheckPolicies } from '../../../common/casl/decorators/policies.decorator';
import type { IAuthenticatedRequest } from '../../../common/interfaces/auth.interface';
import {
  ApiDeleteProfile,
  ApiDeleteUser,
  ApiGetPaginatedUsers,
  ApiGetProfile,
  ApiGetUserById,
  ApiUpdateProfile,
  ApiUpdateUser,
} from '../docs/user.docs';
import { UpdateUserDto, UserFiltersDto } from '../dtos/user.dto';
import {
  DeleteSelfPolicyHandler,
  DeleteUserPolicyHandler,
  ReadSelfPolicyHandler,
  ReadUserPolicyHandler,
  ReadUsersPolicyHandler,
  UpdateSelfPolicyHandler,
  UpdateUserPolicyHandler,
} from '../policies/user.policy';
import { UserService } from '../services/user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // User Routes
  @Get('profile')
  @ApiGetProfile()
  @CheckPolicies(new ReadSelfPolicyHandler())
  async getProfile(@Req() req: IAuthenticatedRequest) {
    return await this.userService.getById({ id: req.user.sub });
  }

  @Patch('profile')
  @ApiUpdateProfile()
  @CheckPolicies(new UpdateSelfPolicyHandler())
  async updateProfile(
    @Req() req: IAuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(req.user.sub, updateUserDto);
  }

  @Delete('profile')
  @ApiDeleteProfile()
  @CheckPolicies(new DeleteSelfPolicyHandler())
  async deleteProfile(@Req() req: IAuthenticatedRequest) {
    await this.userService.softDelete(req.user.sub);
  }

  // Admin Routes
  @Get()
  @ApiGetPaginatedUsers()
  @CheckPolicies(new ReadUsersPolicyHandler())
  async findAll(@Query() filters: UserFiltersDto) {
    return await this.userService.getPaginatedUsers(filters);
  }

  @Get(':id')
  @ApiGetUserById()
  @CheckPolicies(new ReadUserPolicyHandler())
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.getById({ id });
  }

  @Patch(':id')
  @ApiUpdateUser()
  @CheckPolicies(new UpdateUserPolicyHandler())
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiDeleteUser()
  @CheckPolicies(new DeleteUserPolicyHandler())
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.softDelete(id);
  }
}
