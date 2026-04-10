import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Simple guard that checks if the user has ADMIN or MODERATOR role.
 * For fine-grained control, use @Roles() decorator with RolesGuard instead.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      throw new ForbiddenException(
        'Access Denied: Administrative privileges required.',
      );
    }

    return true;
  }
}
