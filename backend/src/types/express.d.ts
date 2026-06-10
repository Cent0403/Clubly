import 'express';

export type AppRole = 'ADMIN' | 'PLAYER';

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: AppRole;
  playerId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
