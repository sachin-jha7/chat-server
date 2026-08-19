import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function Auth() {
    const { register: registerLogin, handleSubmit: handleLoginForm, formState: { errors: loginErrors } } = useForm();
    const { register: registerSignup, handleSubmit: handleSignupForm, formState: { errors: signupErrors } } = useForm();

    const [mode, setMode] = useState("login");
    const [eyeOpen, setEyeOpen] = useState(false);
    const [wrongInfo, setWrongInfo] = useState(null);
    const navigate = useNavigate();

    const loginFormHandler = async (data) => {
        const user = {
            email: data.email,
            password: data.password
        };
        if(data.email == "" || data.password == "") return;
        try {
            const res = await fetch('https://chat-server-70ws.onrender.com/login', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user),
                credentials: "include"
            });
            const result = await res.json();
            if (result === "Logged in successfully") {
                setWrongInfo(result);
                navigate("/chat");
            } else {
                setWrongInfo(result);
            }
        } catch (err) {
            console.log(err)
        }
    }

    const signupFormHandler = async (data) => {
        const newUser = {
            fullName: data.text,
            email: data.email,
            password: data.password
        };
        if(data.text == "" || data.email == "" || data.password == "") return;
        try {
            const res = await fetch('https://chat-server-70ws.onrender.com/signup', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newUser),
                credentials: "include"
            });
            const result = await res.json();
            // console.log(result);
            if (result === "User created successfully") {
                setWrongInfo(result);
                navigate("/chat");
            } else {
                setWrongInfo(result);
            }
        } catch (err) {
            console.log(err);
        }
    }

    const style = {
        padding: "10px",
        // border: "1px solid rgba(16, 185, 129, 0.3)", success
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        // width: "308px",
        // backgroundColor: "rgba(16, 185, 129, 0.2)", success
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        border: "1px solid rgba(239, 68, 68, 0.3)"
    }

    return (
        <div className="page">
            {
                wrongInfo ? (<h3 style={style}>{wrongInfo}</h3>) : null
            }
            <div className="auth-page-wrapper">
                
                {
                    mode == "login" ? (
                        <form onSubmit={handleLoginForm(loginFormHandler)} className="auth-form">
                            <h2>Login to continue...</h2>
                            <div className="form-element">
                                <input autoComplete="off" type="email" placeholder="Enter email..."
                                    {
                                    ...registerLogin("email", { required: "email is required" })
                                    } />
                                {loginErrors.email && (<p style={{ color: "crimson", marginTop: "5px" }}>{loginErrors.email.message}</p>)}
                            </div>
                            <div className="form-element login-password-field">
                                <input type={eyeOpen ? "text" : "password"} placeholder="password..."
                                    {
                                    ...registerLogin("password", { required: "password is required" })
                                    } />
                                <button onClick={() => setEyeOpen(!eyeOpen)} type="button" className="password-toggler-btn">
                                    {
                                        eyeOpen ? (
                                            <FontAwesomeIcon icon={faEyeSlash} />
                                        ) : (
                                            <FontAwesomeIcon icon={faEye} />
                                        )
                                    }
                                </button>

                                {loginErrors.password && (<p style={{ color: "crimson", marginTop: "5px" }}>{loginErrors.password.message}</p>)}
                            </div>
                            <button className="auth-btn">Login</button>
                            <p className="placeholder-text">Don't have an account? <button onClick={() => setMode("signup")} type="button" className="form-opener">Signup</button></p>
                        </form>
                    ) : (
                        <form onSubmit={handleSignupForm(signupFormHandler)} className="auth-form">
                            <h2>Sign up to start chatting...</h2>
                            <div className="form-element">
                                <input autoComplete="off" type="text" placeholder="Enter your name..."
                                    {
                                    ...registerSignup("text", { required: "name is required" })
                                    } />
                                {signupErrors.text && (<p style={{ color: "crimson", marginTop: "5px" }}>{signupErrors.text.message}</p>)}
                            </div>
                            <div className="form-element">
                                <input autoComplete="off" type="email" placeholder="Enter email..."
                                    {
                                    ...registerSignup("email", { required: "email is required" })
                                    } />
                                {signupErrors.email && (<p style={{ color: "crimson", marginTop: "5px" }}>{signupErrors.email.message}</p>)}
                            </div>
                            <div className="form-element login-password-field">
                                <input type={eyeOpen ? "text" : "password"} placeholder="password..."
                                    {
                                    ...registerSignup("password", { required: "password is required" })
                                    } />
                                <button onClick={() => setEyeOpen(!eyeOpen)} type="button" className="password-toggler-btn">
                                    {
                                        eyeOpen ? (
                                            <FontAwesomeIcon icon={faEyeSlash} />
                                        ) : (
                                            <FontAwesomeIcon icon={faEye} />
                                        )
                                    }
                                </button>
                                {signupErrors.password && (<p style={{ color: "crimson", marginTop: "5px" }}>{signupErrors.password.message}</p>)}
                            </div>
                            <button className="auth-btn">Register</button>
                            <p className="placeholder-text">Already have an account? <button onClick={() => setMode("login")} type="button" className="form-opener">Login</button></p>
                        </form>
                    )
                }
            </div>
        </div>
    )
}
