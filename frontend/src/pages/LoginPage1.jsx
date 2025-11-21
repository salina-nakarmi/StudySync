// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import Dashboard from "./Dashboard.jsx";
// import { useNavigate } from "react-router-dom";

// const Login = () => {
//   const location = useLocation();
//   const [isLoginMode, setIsLoginMode] = useState(true);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");
//   const [agreedToTerms, setAgreedToTerms] = useState(false);
// const [showPasswordError, setShowPasswordError] = useState(false);
// const navigate = useNavigate();


//   useEffect(() => {
//     if (location.state?.mode === "signup") {
//       setIsLoginMode(false);
//     } else {
//       setIsLoginMode(true);
//     }
//   }, [location.state]);
   
  

  

//   const passwordCriteria = {
//     length: (pw) => pw.length >= 8,
//     upper: (pw) => /[A-Z]/.test(pw),
//     lower: (pw) => /[a-z]/.test(pw),
//     number: (pw) => /[0-9]/.test(pw),
//     special: (pw) => /[^A-Za-z0-9]/.test(pw),
//   };

//   const handleSubmit = () => {
//     setError("");
//     setShowPasswordError(false);

//     if (!email || !password || (!isLoginMode && !name) || (!isLoginMode && !confirmPassword)) {
//       setError("Please fill in all required fields.");
//       return;
//     }
     
//     if (!email.includes("@")) {
//     setError("Email must contain '@'");
//     return;
//   }

//    if (!isLoginMode) {
//       const isPasswordValid =
//         passwordCriteria.length(password) &&
//         passwordCriteria.upper(password) &&
//         passwordCriteria.lower(password) &&
//         passwordCriteria.number(password) &&
//         passwordCriteria.special(password);

//         if (!isPasswordValid) {
//       setError("Password does not meet all requirements.");
//       setShowPasswordError(true); 
//       return;
//     }

//       if (password !== confirmPassword) {
//         setError("Passwords do not match.");
//         return;
//       }

//     if (!isLoginMode && !agreedToTerms) {
//       setError("Please agree to the terms and privacy policy.");
//       return;
//     }

      
//     }
// navigate("/dashboard");

//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
//         {/* Left Side - Dark gradient with holographic shape */}
//         <div className="hidden lg:flex w-1/2 bg-black flex-col items-center justify-center p-8 relative overflow-hidden">
//           {/* Glow effects */}
//           <div className="absolute inset-0 opacity-50">
//             <div className="absolute top-1 left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
//             <div className="absolute bottom-2 right-10 w-52 h-52 bg-cyan-300 rounded-full blur-3xl"></div>
//           </div>
          
//   <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/50 to-slate-900/40"></div>
//   <div className="relative z-10 text-center text-white">
//             <h2 className="text-3xl font-bold mb-3">Your Journey Starts Here</h2>
//             <p className="text-slate-200 text-lg">Small steps each day lead to big achievements. Track them with StudySync.</p>
//           </div>
//         </div>

//         {/* Right Side - Signup Form */}
//         <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
//           {/* Icon and Title */}
//           <div className="text-center mb-8">
//             <div className="flex justify-center mb-6">
//               <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
//                 <span className="text-white font-bold text-lg sm:text-xl">S</span>
//               </div>
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               {isLoginMode ? "Welcome Back" : "Create an Account"}
//             </h1>
//             <p className="text-gray-600 text-sm">
//               {isLoginMode ? (
//                 <>
//                   Don't have an account?{" "}
//                   <button
//                     onClick={() => {
//                       setIsLoginMode(false);
//                       setError("");
//                     }}
//                     className="text-blue-600 hover:underline font-medium"
//                   >
//                     Sign up
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   Already have an account?{" "}
//                   <button
//                     onClick={() => {
//                       setIsLoginMode(true);
//                       setError("");
//                     }}
//                     className="text-blue-600 hover:underline font-medium"
//                   >
//                     Log in
//                   </button>
//                 </>
//               )}
//             </p>
//           </div>

//           {/* Form Fields */}
//           <form className="space-y-4 mb-6">
//             {/* Name field for signup */}
//             {!isLoginMode && (
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 required
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
//               />
//             )}

//             {/* Email Input */}
//             <input
//               type="email"
//               placeholder="Email address"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//                pattern=".*@.*"
//   title="Email must contain @"
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
//             />

//             {/* Password Input */}
//             <div className="relative">
//               <input
//                 type="password"
//                 placeholder="Input Password"
//                 required
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
//               />
       
// {!isLoginMode && showPasswordError && (
//   <div className="mt-1 text-sm space-y-1">
//     <p className={passwordCriteria.length(password) ? "text-green-600" : "text-red-500"}>
//       {passwordCriteria.length(password) ? "✔" : "✖"} 
//     </p>
//     <p className={passwordCriteria.upper(password) ? "text-green-600" : "text-red-500"}>
//       {passwordCriteria.upper(password) ? "✔" : "✖"} 
//     </p>
//     <p className={passwordCriteria.lower(password) ? "text-green-600" : "text-red-500"}>
//       {passwordCriteria.lower(password) ? "✔" : "✖"} 
//     </p>
//     <p className={passwordCriteria.number(password) ? "text-green-600" : "text-red-500"}>
//       {passwordCriteria.number(password) ? "✔" : "✖"}
//     </p>
//     <p className={passwordCriteria.special(password) ? "text-green-600" : "text-red-500"}>
//       {passwordCriteria.special(password) ? "✔" : "✖"}
//     </p>
//   </div>
// )}

//             </div>

//             {/* Confirm Password for signup */}
//             {!isLoginMode && (
//               <input
//                 type="password"
//                 placeholder="Confirm Password"
//                 required
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-500"
//               />
//             )}

//             {/* Forgot Password - Login only */}
//             {isLoginMode && (
//               <div className="text-right">
//                 <button className="text-sm text-blue-600 hover:underline font-medium">
//                   Forgot password?
//                 </button>
//               </div>
//             )}

//             {/* Terms Checkbox - Signup only */}
//             {!isLoginMode && (
//               <div className="flex items-center gap-3">
//                 <input
//                   type="checkbox"
//                   id="terms"
//                   checked={agreedToTerms}
//                   onChange={(e) => setAgreedToTerms(e.target.checked)}
//                   className="w-4 h-4 border border-gray-300 rounded"
//                 />
//                 <label htmlFor="terms" className="text-sm text-gray-700">
//                   I agree to the{" "}
//                   <a href="#" className="text-blue-600 hover:underline">
//                     Terms and Privacy policy
//                   </a>
//                 </label>
//               </div>
//             )}

//             {/* Error Message */}
//             {error && <p className="text-red-500 text-sm">{error}</p>}

//             {/* Submit Button */}
//             <button
//               type="button"
//               onClick={handleSubmit}
//               className="w-full py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition-colors mt-6"
//             >
//               {isLoginMode ? "Login" : "Create Account"}
//             </button>
//           </form>

//           {/* Divider */}
//           <div className="flex items-center gap-3 mb-6">
//             <div className="flex-1 h-px bg-gray-300"></div>
//             <span className="text-sm text-gray-500">Or</span>
//             <div className="flex-1 h-px bg-gray-300"></div>
//           </div>

//           {/* Social Login Buttons */}
//           <div className="space-y-3">
//             <button className="w-full py-3 border border-gray-300 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              
//               <span className="text-gray-700 font-medium">Sign up with Google</span>
//             </button>

//             <button className="w-full py-3 border border-gray-300 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              
//               <span className="text-gray-700 font-medium">Sign up with Facebook</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
