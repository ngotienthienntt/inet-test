import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';

type SanitizedUser = Omit<User, 'passwordHash'>;

function sanitizeUser(user: User): SanitizedUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request): Promise<SanitizedUser> {
    const authUser = req.user as User;
    const user = await this.usersService.findById(authUser.id);
    return sanitizeUser(user!);
  }

  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<SanitizedUser> {
    const authUser = req.user as User;
    const updated = await this.usersService.updateProfile(authUser.id, dto);
    return sanitizeUser(updated);
  }
}
