import { useState, useEffect } from 'react';
import bgimg from '../assets/Texting-bro.png';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';


export default function GetStarted() {

    const navigate = useNavigate();
    const [appState, setAppState] = useState("idle");

    const fetchData = async () => {
        // console.log("fetch")
        setTimeout(() => {
            setAppState("waking");
        }, 10);
        setTimeout(() => {
            setAppState("almost");
        }, 30000);
        const res = await fetch("http://localhost:4040/", {
            credentials: "include"
        });
        const result = await res.json();
        if (result === "Unauthorized") {
            navigate("/auth");
        } else {
            navigate("/chat");
        }
    }

    useEffect(() => {
        // fetchData();
        const isDataAvailable = async () => {
            const res = await fetch("http://localhost:4040/", {
                credentials: "include"
            });
            const result = await res.json();
            if (result === "Unauthorized") {
                navigate("/");
            } else {
                navigate("/chat");
            }
        }
        isDataAvailable();
    }, []);

    return (
        <div className="page">
            <div className="starter-page-wrapper">
                <div className="left">
                    <h2>Meet New People & Make Friends</h2>
                    <p>Join A Community Of Like-Minded Individuals And Make Meaningful Connections.</p>
                    
                    {
                        appState == "waking" ? (
                            <button className="waking">Waking up server...<FontAwesomeIcon className="force-spin" icon={faCircleNotch} /></button>
                        ) : appState == "almost" ? (
                            <button className="almost">Almost there...<FontAwesomeIcon className="force-spin" icon={faCircleNotch} /></button>
                        ) : <button onClick={fetchData} className="cta-btn">Get Started </button>
                    }
                </div>
                <div className="right">
                    <img src={bgimg} />
                </div>
            </div>

        </div>
    )
}