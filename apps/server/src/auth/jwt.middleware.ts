import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
        (req as any).user = decoded as { sub: string; email: string };
      } catch {
        (req as any).user = null;
      }
    } else {
      (req as any).user = null;
    }

    next();
  }
}
