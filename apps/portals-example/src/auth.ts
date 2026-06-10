import NextAuth from 'next-auth';
import { authOptions } from './utils/auth/auth-options';

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
