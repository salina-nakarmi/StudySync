// Route definitions
import React from "react";
import { Routes, Route , Navigate} from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ClerkProviderWithRoutes } from "./auth/ClerkProviderWithRoutes.jsx";
import AuthenticationPage from "./auth/AuthenticationPage.jsx";
import EmailVerification from "./auth/EmailVerification.jsx";
import SSOCallback from "./auth/SSOCallback.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import ProgressTracking from "./pages/ProgressTracking.jsx";
import Profile from "./pages/Profile.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Groups from "./pages/Groups.jsx";





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
              <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          }
        />

        <Route 
          path="/dashboard" 
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } 
        />

        <Route 
  path="/groups" 
  element={
    <>
      <SignedIn>
        <Groups />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  } 
/>



        <Route 
  path="/progress-tracking" 
  element={
    <>
      <SignedIn>
        <ProgressTracking />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  } 
/>

<Route
  path="/profile"
  element={
    <>
      <SignedIn>
        <ProfilePage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  }
/>




        <Route path="/sign-in/*" element={<AuthenticationPage />} />
        <Route path="/sign-up/*" element={<AuthenticationPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* SSO Callback Route - NOW USING THE COMPONENT */}
        <Route path="/sso-callback" element={<SSOCallback />} />
        
        <Route path="*" element={<RedirectToSignIn />} />
      </Routes>
    </ClerkProviderWithRoutes>
  );
}

export default App;