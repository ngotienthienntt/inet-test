import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  // Override handleRequest so missing/invalid tokens result in null user
  // instead of throwing an UnauthorizedException
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      return null as TUser;
    }
    return user as TUser;
  }
}
