// Route definitions
import React from "react";
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ClerkProviderWithRoutes } from "./auth/ClerkProviderWithRoutes.jsx";
import AuthenticationPage from "./auth/AuthenticationPage.jsx";
import EmailVerification from "./auth/EmailVerification.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";

function App() {
  return (
    <ClerkProviderWithRoutes>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <Home />
              </SignedOut>
              <SignedIn>
                <Dashboard />
              </SignedIn>
            </>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sign-in/*" element={<AuthenticationPage />} />
        <Route path="/sign-up/*" element={<AuthenticationPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />

           {/* SSO Callback Route */}
        <Route 
          path="/sso-callback" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Completing sign-in...</p>
              </div>
            </div>
          } 
        />
        
        <Route path="*" element={<RedirectToSignIn />} />
      </Routes>
    </ClerkProviderWithRoutes>
  );
}

export default App;