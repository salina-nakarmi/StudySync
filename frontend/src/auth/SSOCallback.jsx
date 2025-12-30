import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    async function handleCallback() {
      try {
        // If already signed in, just redirect
        if (isLoaded && isSignedIn) {
          console.log('✅ Already signed in, redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('🔄 Handling OAuth callback...');
        
        // Handle the OAuth callback
        await handleRedirectCallback();
        
        console.log('✅ OAuth successful, redirecting to dashboard...');
        
        // Small delay to ensure session is set
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
        
      } catch (error) {
        console.error('❌ SSO callback error:', error);
        
        // Redirect to login page on error
        navigate('/sign-in', { 
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    }

    handleCallback();
  }, [handleRedirectCallback, navigate, isSignedIn, isLoaded]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Completing sign-in...
        </h2>
        <p className="text-gray-500">Please wait while we log you in</p>
      </div>
    </div>
  );
}