// Route definitions
import React from "react";
import { Routes, Route , Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ClerkProviderWithRoutes } from "./auth/ClerkProviderWithRoutes.jsx";
import AuthenticationPage from "./auth/AuthenticationPage.jsx";
import EmailVerification from "./auth/EmailVerification.jsx";
import SSOCallback from "./auth/SSOCallback.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import ProgressTracking from "./pages/ProgressTracking.jsx";
import Resources from "./pages/Resources.jsx";
import Profile from "./pages/Profile.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Groups from "./pages/Groups.jsx";
import Feed from "./pages/Feed.jsx";
import Messages from "./pages/Messages.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import Docs from "./pages/Docs.jsx";
import UnifiedStudyTimer from "./components/UnifiedStudyTimer.jsx";
//Import Chatbot Widget for global access
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import JoinProject from "./pages/JoinProject.jsx";





function App() {
  const location = useLocation();
  const showGlobalTimer = location.pathname !== "/dashboard";

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
  path="/feed" 
  element={
    <>
      <SignedIn>
        <Feed />
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
          path="/resources"
          element={
            <>
              <SignedIn>
                <Resources />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route
          path="/projects"
          element={
            <>
              <SignedIn>
                <Projects />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

<Route
  path="/projects/:id"
  element={
    <>
      <SignedIn>
        <ProjectDetail />
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

        <Route
          path="/messages"
          element={
            <>
              <SignedIn>
                <Messages />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />




        <Route
<<<<<<< HEAD
          path="/documents"
=======
          path="/docs"
>>>>>>> cbad5c1133e1c2b70224ae2138832950fb9088d8
          element={
            <>
              <SignedIn>
                <Docs />
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

        {/* PUBLIC — deliberately NOT wrapped in <SignedIn>/<SignedOut>
            like every other route in this file. JoinProject.jsx handles
            its own auth branching internally: anonymous visitors see the
            invite preview (GET /api/invitations/{token} is a public
            backend endpoint, no Clerk token required), and clicking
            Accept while logged out calls Clerk's redirectToSignUp with
            redirectUrl set to this exact URL, so they land back here
            with the same ?token=xxx after signing up/in. */}
        <Route path="/join" element={<JoinProject />} />
 
        {/* SSO Callback Route - NOW USING THE COMPONENT */}
        <Route path="/sso-callback" element={<SSOCallback />} />
        
        <Route path="*" element={<RedirectToSignIn />} />
        
      </Routes>
      {showGlobalTimer && (
        <SignedIn>
          <UnifiedStudyTimer />
        </SignedIn>
      )}
      {/* Chatbot Widget - Shows on ALL pages */}
      <ChatbotWidget />
    </ClerkProviderWithRoutes>
  );
}

export default App;