import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

// USER ROUTES

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current logged-in user profile' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'The profile has been successfully retrieved.',
      type: UserEntity,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires READ_SELF permission.',
    }),
  );
}

export function ApiUpdateProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Update current logged-in user profile' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Your profile has been successfully updated.',
      type: UserEntity,
    }),
    ApiConflictResponse({ description: 'Email is already in use.' }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires UPDATE_SELF permission.',
    }),
  );
}

export function ApiDeleteProfile() {
  return applyDecorators(
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete current logged-in user account' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Your account has been successfully deleted.',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires DELETE_SELF permission.',
    }),
  );
}

// ADMIN ROUTES

export function ApiCreateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new user account (Admin/Public)' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'The user has been successfully created.',
      type: UserEntity,
    }),
    ApiConflictResponse({ description: 'Email is already registered.' }),
    ApiBadRequestResponse({ description: 'Invalid payload.' }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires CREATE_USER permission.',
    }),
  );
}

export function ApiGetPaginatedUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated users with dynamic filters (Admin)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Returns a paginated list of users and metadata.',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires READ_USERS permission.',
    }),
  );
}

export function ApiGetUserById() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve a specific user by UUID (Admin)' }),
    ApiParam({ name: 'id', description: 'The UUID of the user' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'The user has been successfully found.',
      type: UserEntity,
    }),
    ApiNotFoundResponse({ description: 'User not found.' }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires READ_USER permission.',
    }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a specific user profile (Admin)' }),
    ApiParam({ name: 'id', description: 'The UUID of the user' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'The user has been successfully updated.',
      type: UserEntity,
    }),
    ApiNotFoundResponse({ description: 'User not found.' }),
    ApiConflictResponse({ description: 'Email is already in use.' }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires UPDATE_USER permission.',
    }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Soft delete a specific user account (Admin)' }),
    ApiParam({ name: 'id', description: 'The UUID of the user' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'The user has been successfully deleted.',
    }),
    ApiNotFoundResponse({ description: 'User not found.' }),
    ApiForbiddenResponse({
      description: 'Forbidden. Requires DELETE_USER permission.',
    }),
  );
}
