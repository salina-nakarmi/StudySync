import React, {useState} from "react"

const Login=() => {
    const [isLoginMode, setIsLoginMode]=useState(true)
return(
    <div className="w-[430px] bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex justify-center mb-4">
            <h2 className="text-3xl font-semibold text-center">{ isLoginMode ? "Login" : "Sign Up" }</h2>
        </div>

        <div className="relative flex h-12 mb-6 border-gray-300 rounded-full overflow-hidden">
            <button onClick={() => setIsLoginMode(true)}>
                Login
            </button>

            <button onClick={()=> setIsLoginMode(false)}>
                Sign Up
            </button>
            <div></div>
        </div>

        {/* form section */}

        <form>
            {! isLoginMode && (
                <input type="text" placeholders='Name' required />
            )}

            {/* Shared input field */}
            <input type="email" placeholder='Email Address' required/>
            <input type="password" placeholder='Password' required />

            {/* Signup field */}

            {!isLoginMode &&(
            <input type="password" placeholder='Confirm Password' required/>
            )}

            {/* forget password for login */}
            {isLoginMode &&(
                <div>
                    <p>Foreget password</p>
                </div>
            )}

            {/* shared button */}
            <button>
                {isLoginMode ? "Login" : "Signup"}
            </button>

            {/* switch link */}
            <p>{ isLoginMode ? "Don't have an account" : "Already have an account"}</p>
            <a href="#" onClick={()=> setIsLoginMode(!isLoginMode)}>
                {isLoginMode ? "Signup now" : "Login"}
            </a>
        </form>
    </div>

)
}
export default Login
   