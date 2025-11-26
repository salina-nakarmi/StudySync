import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignUp, useSignIn, useUser} from "@clerk/clerk-react";

export default function AuthenticationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();

    // Redirect if already signed in
    useEffect(() => {
      if (isSignedIn) {
        navigate("/dashboard");
      }
    }, [isSignedIn, navigate]);

  useEffect(() => {
    if (location.state?.mode === "signup") {
      setIsLoginMode(false);
    } else {
      setIsLoginMode(true);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login flow
        if (!signInLoaded) {
          setError("Authentication not ready. Please wait...");
          setIsLoading(false);
          return;
        }
        
        const result = await signIn.create({
          identifier: email,
          password,
        });
        
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate("/dashboard");
        }
      } else {
        // Signup validation
        if (!name || !email || !password || !confirmPassword) {
          setError("Please fill in all fields");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        if (!agreedToTerms) {
          setError("Please agree to the terms and privacy policy");
          setIsLoading(false);
          return;
        }

        // Sign up
        await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
        });

        // Send verification email
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

         // Redirect to verification page
         navigate("/verify-email");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError(
          err.errors?.[0]?.longMessage || 
          err.message || 
          "Something went wrong. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    if (!signInLoaded) {
      setError("Please wait...");
      return;
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Please try again.");
    }
  };




  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative p-8 items-center justify-center">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-1 left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-2 right-10 w-52 h-52 bg-cyan-300 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-center text-white">
            <h2 className="text-3xl font-bold mb-3">Your Journey Starts Here</h2>
            <p className="text-lg">
              Small steps each day lead to big achievements. Track them with StudySync.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">S</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLoginMode ? "Welcome Back" : "Create an Account"}
            </h1>
            <p className="text-gray-600 text-sm">
              {isLoginMode ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setError("");
                      setMessage("");
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setIsLoginMode(true);
                      setError("");
                      setMessage("");
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {!isLoginMode && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
            />

            {!isLoginMode && (
              <>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms and Privacy policy
                    </a>
                  </label>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}


            <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 rounded-full border border-gray-300 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Continue with Google
                </button>

                <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? "Please wait..." 
                : isLoginMode 
                  ? "Login" 
                  : "Create Account"
              }
              </button>
          </form>
        </div>
      </div>
    </div>
  );
}
