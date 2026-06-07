import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../common/types/index';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access restricted to administrators');
    }

    return true;
  }
}
