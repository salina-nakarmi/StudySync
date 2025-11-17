import React, { useState , useEffect} from "react";
import { useLocation } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import { useNavigate } from "react-router-dom";



const Login = () => {
     const location = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const[name, setName]=useState("");
  const[email, setEmail]=useState("");
  const[password, setPassword]=useState("");
  const[confirmPassword, setConfirmPassword]=useState("");
  const[error, setError]=useState("");  

    const Navigate = useNavigate();
    


    useEffect(() => {
    if (location.state?.mode === "signup") {
      setIsLoginMode(false);
    } else {
      setIsLoginMode(true);
    }
  }, [location.state]);


   const checkPasswordStrength = (pw) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);

    if (pw.length < minLength) return "Password must be at least 8 characters.";
    if (!hasUpper) return "Password must contain an uppercase letter.";
    if (!hasLower) return "Password must contain a lowercase letter.";
    if (!hasNumber) return "Password must contain a number.";
    if (!hasSpecial) return "Password must contain a special character.";

    return ""; // password is strong
  };


  const handleSubmit = () => {
    setError("");

    if (!email || !password || (!isLoginMode && !name) || (!isLoginMode && !confirmPassword)) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isLoginMode) {
      const passwordError = checkPasswordStrength(password);
      if(passwordError){
        setError(passwordError);
        return;
      }

    if (!isLoginMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  }
    Navigate("/dashboard");
   
  };
    

  


  return (
    <div div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-[430px] bg-white p-8 rounded-2xl shadow-lg">
      {/* Title */}
      <div className="flex justify-center mb-4">
        <h2 className="text-3xl font-semibold text-center">
          {isLoginMode ? "Welcome Back" : "Create Your Account"}
        </h2>
      </div>

      {/* Toggle Buttons */}
      <div className="relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden">
        <button
          onClick={() => setIsLoginMode(true)}
          className={`w-1/2 text-lg font-medium transition-all z-10 ${
            isLoginMode ? "text-white" : "text-black"
          }`}
        >
          Login
        </button>

        <button
          onClick={() => setIsLoginMode(false)}
          className={`w-1/2 text-lg font-medium transition-all z-10 ${
            !isLoginMode ? "text-white" : "text-black"
          }`}
        >
          Sign Up
        </button>

        {/* Sliding background */}
        <div
          className={`absolute top-0 h-full w-1/2 rounded-full  bg-gradient-to-r from-gray-900 to-gray-700 transition-all duration-300 ${
            isLoginMode ? "left-0" : "left-1/2"
          }`}
        ></div>
      </div>

      {/* Form Section */}
      <form className="space-y-4">
        {/* Name field for signup */}
        {!isLoginMode && (
          <input
            type="text"
            placeholder="Name"
            required
              value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-gray-600 placeholder-gray-400"
          />
        )}

        {/* Shared Input Fields */}
        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-gray-600 placeholder-gray-400"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-gray-600 placeholder-gray-400"
        />

        {/* Confirm Password for signup */}
        {!isLoginMode && (
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) =>setConfirmPassword(e.target.value)}
            className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-gray-600 placeholder-gray-400"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p> }

        {/* Forget password (only for login) */}
        {isLoginMode && (
          <div className="text-right">
            <p className="text-black hover:underline cursor-pointer">
              Forgot password?
            </p>
          </div>
        )}

        {/* Submit Button */}
      <button
  type="button"
  onClick={handleSubmit}
  className="w-full p-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white text-lg font-medium hover:opacity-90 transition"
>
  {isLoginMode ? "Login" : "Sign Up"}
</button>



        {/* Switch link */}
        <div className="text-center mt-3">
          <p className="text-gray-600">
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsLoginMode(!isLoginMode);
            }}
            className="text-black hover:underline font-medium"
          >
            {isLoginMode ? "Sign Up now" : "Login"}
          </a>
        </div>
      </form>
    </div>
    </div>
    
  );
};

export default Login;
