'use client';

import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // Authentication is handled at the routing layer by NextAuth v5 Middleware.
  // This component serves as a pass-through wrapper for the dashboard layouts.
  return <>{children}</>;
}
