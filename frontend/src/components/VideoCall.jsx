import { useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCameraRotate, faPhoneFlip, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { DataContext } from "../context/DataContext";

export default function VideoCall({ socket, isInComingCall, setIsInComingCall }) {
    const { initializeCall, setInitializeCall, setShowMessageComponent, setShowChatComponent } = useContext(DataContext);

    const [callInfoNotNeeded, setCallInfoNotNeeded] = useState(false);
    const [callAccepted, setCallAcceped] = useState(false);

    // const [payload, setPayload] = useState({});
    const [facingMode, setFacingMode] = useState("environment");
    const pc = useRef(null);
    // const [stream, setStream] = useState(null);
    const streamRef = useRef(null);
    const callerRef = useRef(null);
    const receiverRef = useRef(null);

    const configuration = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            },
            {
                urls: "stun:stunserver.stunprotocol.org:3478"
            },
            {
                urls: "stun:stun.counterpath.com:3478"
            }
        ]
    };

    // Initialization
    useEffect(() => {
        pc.current = new RTCPeerConnection(configuration);

        pc.current.ontrack = (event) => {
            receiverRef.current.srcObject = event.streams[0];
            setCallInfoNotNeeded(true);
        }
        if (initializeCall.caller == true) {
            // console.log("executed")
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    // console.log(
                    //     "LOCAL ICE CANDIDATE:",
                    //     event.candidate.candidate
                    // );
                    const iceCandidate = event.candidate.toJSON();
                    socket.emit("send-ice-candidate-from-caller", { iceCandidate, initializeCall });
                }
            }
        } else {
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    // console.log(
                    //     "LOCAL ICE CANDIDATE:",
                    //     event.candidate.candidate
                    // );
                    const iceCandidate = event.candidate.toJSON();
                    socket.emit("send-ice-candidate-from-receiver", { iceCandidate, initializeCall });
                }
            }
        }

        return () => {
            pc.current?.close();
        }
    }, [initializeCall])

    // Checking different stages of connection
    // useEffect(() => {
    //     pc.current.onicegatheringstatechange = () => {
    //         console.log(
    //             "ICE gathering:",
    //             pc.current.iceGatheringState
    //         );
    //     };

    //     pc.current.oniceconnectionstatechange = () => {
    //         console.log(
    //             "ICE connection:",
    //             pc.current.iceConnectionState
    //         );
        // };

        // pc.current.onconnectionstatechange = () => {
        //     console.log(
        //         "Peer connection:",
        //         pc.current.connectionState
        //     );
        // };

        // pc.current.onsignalingstatechange = () => {
        //     console.log(
    //             "Signaling:",
    //             pc.current.signalingState
    //         );
    //     };
    // }, [])


    // Caller
    const startVideoCall = async () => {
        
        await startCamera();
        pc.current.onnegotiationneeded = async () => {
            try {
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                const sdpOffer = pc.current.localDescription;
                // console.log("sending sdp offer");
                socket.emit("send-SDP-offer-from-caller", { sdpOffer, initializeCall });
            } catch (error) {
                console.log(error);
            }
        }
        // console.log(pc.current.localDescription);

    }

    // listen ICE Candidate 
    useEffect(() => {
        const pathFinder = async ({ iceCandidate }) => {
            // console.log("RECEIVED ICE OBJECT:", iceCandidate);
            if (!iceCandidate) return;

            try {
                await pc.current.addIceCandidate(
                    new RTCIceCandidate(iceCandidate)
                );
                // console.log("Remote ICE candidate added");

            } catch (error) {
                console.error(
                    "Failed to add remote ICE candidate:",
                    error
                );
            }
        }
        socket.on("get-ice-candidate-from-server", pathFinder);
        return () => {
            socket.off("get-ice-candidate-from-server", pathFinder);
        }
    }, []);


    // listen SDP answer
    useEffect(() => {
        const handleRemotePeerSDPAnswer = async (sdpAnswer) => {
            try {
                const remoteAnswer = new RTCSessionDescription(sdpAnswer);
                await pc.current.setRemoteDescription(remoteAnswer);
                // console.log("Connection handshake successful");
            } catch (error) {
                console.log("Failed to set remote Description: ", error)
            }
        }
        socket.on("get-remote-peer-SDP-answer", handleRemotePeerSDPAnswer);
        return () => {
            socket.off("get-remote-peer-SDP-answer", handleRemotePeerSDPAnswer);
        }
    }, []);


    // Receiver 
    useEffect(() => {
        const sendSDPAnswer = async (data) => {
            
            await startCamera();
            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdpOffer));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            await socket.emit("send-SDP-answer-to-server", { sdpAnswer: pc.current.localDescription, callerId: data.callerId });
        }
        socket.on("get-SDP-offer-from-caller", sendSDPAnswer);
        return () => {
            socket.off("get-SDP-offer-from-caller", sendSDPAnswer);
        }
    }, []);

    const startCamera = async () => {
        
        closeMediaStream();
        try {
            const constraints = {
                video: { facingMode: facingMode },
                audio: true
            }
            const localStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = localStream;
            callerRef.current.srcObject = localStream;
            localStream.getTracks().forEach(track => {
                pc.current.addTrack(track, localStream);
            });
            
        } catch(error) {
            console.log("Error accessing camera with facingMode: ", error);
        }
    }

    const flipCamera = () => {
        // console.log("executed")
        setFacingMode((prevMode) => prevMode == "environment" ? "user" : "environment");
    }

    const closeMediaStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            })
            callerRef.current.srcObject = null;
        }
    }

    const receiveCall = () => {
        socket.emit("call-accepted", initializeCall);
        setCallAcceped(true);
    }

    const endCall = (callBy) => {
        setIsInComingCall(false);
        closeMediaStream();
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (window.innerWidth <= 630) {
            setShowMessageComponent(false);
            setShowChatComponent(true);
        }
        setInitializeCall(null);
        if (callBy == "caller") {
            socket.emit("end-the-call", initializeCall);
        } else {
            socket.emit("end-the-call", initializeCall);
        }
    }

    // When Opposire peer ends the call
    useEffect(() => {
        const closeCallWindow = (data) => {
            if (window.innerWidth <= 630) {
                setShowMessageComponent(false);
                setShowChatComponent(true);
            }
            if (pc.current) {
                pc.current.close();
                pc.current = null;
            }
            closeMediaStream();
            setInitializeCall(null);
            setIsInComingCall(false);
        }
        socket.on("call-ends", closeCallWindow);
        return () => {
            socket.off("call-ends", closeCallWindow);
        }
    }, []);

    // Call accepted by receiver
    useEffect(() => {
        const acceptCallHandler = (data) => {
            startVideoCall();
        }
        socket.on("receiver-accepts-the-call", acceptCallHandler);
        return () => {
            socket.off("receiver-accepts-the-call", acceptCallHandler)
        }
    }, []);





    return (
        <div className="video-wrapper">
            {
                isInComingCall ? (
                    <div style={callInfoNotNeeded ? { display: "none" } : { display: "flex" }} className="caller-info">
                        <h2>Incoming Call from {initializeCall.callerUserName}</h2>
                        <img src={initializeCall.callerImageUrl} alt="user-img" />
                    </div>
                ) : (
                    <div style={callInfoNotNeeded ? { display: "none" } : { display: "flex" }} className="caller-info">
                        <h2>Calling... {initializeCall.data.fullName}</h2>
                        <img src={initializeCall.data.imageUrl} alt="user-img" />
                    </div>
                )
            }


            <div className="video-container">
                <video ref={callerRef} className="caller-video" autoPlay playsInline />
                <video ref={receiverRef} className="receiver-video" autoPlay playsInline />
            </div>
            {
                window.innerWidth <= 630 && callInfoNotNeeded == true ? (
                    <button onClick={flipCamera} className="camera-flip"><FontAwesomeIcon icon={faCameraRotate} /></button>
                ) : null
            }

            <div className="controls">
                {
                    isInComingCall ? (
                        <>
                            <button onClick={() => endCall({ callBy: "receiver" })} className="call-btn end-call"><FontAwesomeIcon icon={faPhoneFlip} /></button>
                            <button style={callAccepted ? { display: "none" } : { display: "block" }} onClick={receiveCall} className="call-btn receive-call"><FontAwesomeIcon icon={faPhoneVolume} /></button>
                        </>
                    ) : (
                        <button onClick={() => endCall({ callBy: "caller" })} className="call-btn end-call"><FontAwesomeIcon icon={faPhoneFlip} /></button>
                    )
                }
            </div>
        </div>
    )
}
