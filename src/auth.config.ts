import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname === '/' ||
        nextUrl.pathname === '/upload' ||
        nextUrl.pathname.startsWith('/workspace') ||
        nextUrl.pathname.startsWith('/workspaces') ||
        nextUrl.pathname.startsWith('/database-connection');
      if (isOnProtectedRoute) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
