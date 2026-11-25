import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as any)?.role;
      const { pathname } = nextUrl;

      // Role gate /admin: requires ADMIN
      if (pathname.startsWith('/admin')) {
        if (!isLoggedIn) return false;
        return userRole === 'ADMIN';
      }

      // Role gate /official: requires OFFICIAL or ADMIN
      if (pathname.startsWith('/official')) {
        if (!isLoggedIn) return false;
        return userRole === 'OFFICIAL' || userRole === 'ADMIN';
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'CITIZEN';
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || 'CITIZEN';
      }
      return session;
    },
  },
  providers: [], // Filled in auth.ts with Node runtime
} satisfies NextAuthConfig;
