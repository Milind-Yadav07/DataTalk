import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Protects: /, /upload, /workspace, /workspaces, /database-connection
  // Public routes: /login, /register, /share/[id], /api/*
  matcher: [
    '/',
    '/upload',
    '/workspace/:path*',
    '/workspaces/:path*',
    '/database-connection/:path*'
  ],
};
