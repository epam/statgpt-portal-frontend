import { Session, TokenSet } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export interface Token extends JWT {
  providerId: string;
  userId: string;
  refreshToken: string | TokenSet;
}

export interface UserSession extends Session {
  providerId: string;
  error?: unknown;
}

export enum AuthUiMode {
  Tab = 'tab',
  SameWindow = 'sameWindow',
}
