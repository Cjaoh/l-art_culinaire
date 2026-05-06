import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Ne pas rejeter la requête si pas de token
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Pas de token, continuer sans auth
      request.user = null;
      return true;
    }
    
    // Token présent, valider normalement
    return super.canActivate(context);
  }
}
