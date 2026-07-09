import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser, AppRole } from '../types/express';

interface JwtPayload {
  userId: number;
  username: string;
  fullName: string;
  role: AppRole;
  playerId: number | null;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res
      .status(401)
      .json({ message: 'Falta o es inválido el encabezado de autorización' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user: AuthUser = {
      userId: payload.userId,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
      playerId: payload.playerId,
    };

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requireRole(...allowedRoles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Prohibido' });
      return;
    }

    next();
  };
}
