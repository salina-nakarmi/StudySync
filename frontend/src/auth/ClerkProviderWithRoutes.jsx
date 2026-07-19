
// Clerk authentication setup
import React, { useCallback } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error("Missing Publishable Key");

export function ClerkProviderWithRoutes({ children }) {
  const navigate = useNavigate();
  // ClerkProvider uses `navigate` internally in an effect — passing a fresh
  // inline function here on every render makes that effect re-run constantly,
  // which destabilizes Clerk's auth state and remounts everything inside
  // <SignedIn>. Must stay referentially stable across renders.
  const clerkNavigate = useCallback((to) => navigate(to), [navigate]);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={clerkNavigate}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}