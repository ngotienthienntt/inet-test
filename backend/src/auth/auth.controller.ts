import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { SanitizedUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

function sanitizeUser(user: User): SanitizedUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

@ApiTags('Auth')
@Throttle({ short: { ttl: 60000, limit: 5 }, medium: { ttl: 3600000, limit: 20 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ user: SanitizedUser; accessToken: string }> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<{ user: SanitizedUser; accessToken: string }> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Generate a guest session token' })
  @ApiResponse({ status: 201, description: 'Guest session token generated' })
  @Post('guest')
  generateGuestToken(): { sessionToken: string } {
    return this.authService.generateGuestToken();
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request): SanitizedUser {
    return sanitizeUser(req.user as User);
  }
}
