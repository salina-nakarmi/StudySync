// src/auth/EmailVerification.jsx
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function EmailVerification() {
  const { signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setError("");
    setIsVerifying(true);

    try {
      // Verify the email code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // Set the session active
        await setActive({ session: completeSignUp.createdSessionId });
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await signUp.prepareEmailAddressVerification();
      setError("");
      alert("Verification code resent! Check your email.");
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-sm">
            We've sent a verification code to your email address. Please enter it below.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500 text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="w-full py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}