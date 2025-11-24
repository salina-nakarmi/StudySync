// Route definitions
import React from "react";
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ClerkProviderWithRoutes } from "./auth/ClerkProviderWithRoutes.jsx";
import AuthenticationPage from "./auth/AuthenticationPage.jsx";
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

        <Route path="*" element={<RedirectToSignIn />} />
      </Routes>
    </ClerkProviderWithRoutes>
  );
}

export default App;