
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faArrowLeft, faUserPlus, faCommentDots, faCircleUser } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';

import { io } from 'socket.io-client';
import ProfileComponent from '../components/ProfileComponent';
import MessageComponent from '../components/MessageComponent';
import FriendsComponent from '../components/FriendsComponent';
import SearchUser from '../components/SearchUser';
import Notifiactions from '../components/Notifications';
const socket = io("https://chat-server-70ws.onrender.com", { autoConnect: false, withCredentials: "include" });
//
import { DataContext } from '../context/DataContext';
import VideoCall from '../components/VideoCall';
let currentUserId;

export default function Chat() {

    const { notificationArray, showChatComponent, setShowChatComponent,
        showProfileComponent, setShowProfileComponent,
        showMessageComponent, setShowMessageComponent
        , isSearchFormOpen, setIsSearchFormOpen, isNotifiOpen,
        setIsNotifiOpen, initializeCall, setInitializeCall} = useContext(DataContext);

    const [isInComingCall, setIsInComingCall] = useState(false);
    const [currUserData, setCurrUserData] = useState(null);
    const navigate = useNavigate();


    const openChatComponent = () => {
        setShowChatComponent(true);
        setIsNotifiOpen(false);
        setShowProfileComponent(false);
        setIsSearchFormOpen(false);
    }
    const openSearchUserComponent = () => {
        setShowChatComponent(false);
        setShowProfileComponent(false);
        setIsNotifiOpen(false);
        setIsSearchFormOpen(true);
    }
    const openNotificationComponent = () => {
        setShowChatComponent(false);
        setIsNotifiOpen(true);
        setShowProfileComponent(false);
        setIsSearchFormOpen(false);
    }
    const openProfileComponent = () => {
        setShowChatComponent(false);
        setIsNotifiOpen(false);
        setShowProfileComponent(true);
        setIsSearchFormOpen(false);
    }

    const updateFriendList = (whoSentRequest, imageUrl, fullName) => {
        const userObj = {
            fullName: fullName,
            imageUrl: imageUrl,
            _id: whoSentRequest,
        }
        currUserData.friendsList.push(userObj)
    }






    useEffect(() => {
        if (window.innerWidth > 630) {
            setShowMessageComponent(true);
        }
        const loadData = async () => {
            const res = await fetch("https://chat-server-70ws.onrender.com/", {
                credentials: "include"
            });
            const result = await res.json();
            if (result === "Unauthorized") {
                // setIsDataAvailable(false);
                navigate("/auth");
                setCurrUserData(null);
            } else {

                setCurrUserData(result);

                if (!socket.connected) {
                    socket.connect();
                    const roomId = result.currentUser;
                    currentUserId = result.currentUser;
                    // console.log(currentUserId)
                    socket.emit("register-user", roomId);  //When user logs-in then join them in a room so that server can identify
                }

                return () => {
                    socket.disconnect();
                };

                // console.log("re-rendering")

            }

        }
        loadData();
    }, []);

    // let notificationArray = [];



    // console.log("fired")


    useEffect(() => {
        const updateSenderFriendList = (data) => {
            const userObj = {
                fullName: data.fullName,
                imageUrl: data.imageUrl,
                _id: data.userId,
            }
            setCurrUserData((prev) => ({
                ...prev,
                friendsList: [...prev.friendsList, userObj]
            }));
        }
        socket.on("update-sender-friend-list", updateSenderFriendList);
        return () => {
            socket.off("update-sender-friend-list", updateSenderFriendList);
        }
    }, []);


    useEffect(() => {
        socket.on("update-receiver-friend-list", (data) => {
            console.log(data);
            const userObj = {
                fullName: data.fullName,
                imageUrl: data.imageUrl,
                _id: data.whoSentRequest,
            }
            // currUserData.friendsList.push(userObj)
            setCurrUserData((prev) => ({
                ...prev,
                friendsList: [...prev.friendsList, userObj]
            }));
        })
    }, []);

    // open call window when there's incoming call
    useEffect(() => {
        const listenIncomingCall = (data) => {
            if (window.innerWidth <= 630) {
                setShowMessageComponent(true);
                setShowChatComponent(false);
            }
            // console.log(data)
            setIsInComingCall(true);
            setInitializeCall({ ...data, caller: false });
            // console.log(initializeCall)
        }
        socket.on("listen-video-call", listenIncomingCall);
        return () => {
            socket.off("listen-video-call", listenIncomingCall);
        }
    }, [])



    return (


        currUserData ? (
            <div className="page">
                <div className="home-page-wrapper">
                    <div style={showChatComponent ? { display: "flex" } : { display: "none" }} className="nav">
                        <h2 ><FontAwesomeIcon icon={faCommentDots} /> Chat Server</h2>
                        <div className="friend-list-nav">
                            <div onClick={() => setIsNotifiOpen(true)} className="notification-btn">
                                <FontAwesomeIcon icon={faBell} color='#dadada' />
                                {notificationArray.length > 0 ? (<span>+{notificationArray.length}</span>) : null}

                            </div>
                            {/* <button  className="notifi-btn"></button> */}
                            <button onClick={() => setIsSearchFormOpen(true)} className="find-people-btn">Find People</button>
                        </div>
                    </div>

                    <div className="main">

                        {/* Friends section */}

                        <FriendsComponent currUserData={currUserData} socket={socket} />


                        {/* Chat Section */}

                        <MessageComponent currUserData={currUserData} socket={socket} />

                        {/* Profile section */}

                        <ProfileComponent currUserData={currUserData} setCurrUserData={setCurrUserData} />

                    </div>

                    {/* Search Users section */}

                    {
                        isSearchFormOpen ? (
                            <SearchUser socket={socket} currUserData={currUserData} />
                        ) : null
                    }


                    {/* Notification section */}

                    {
                        isNotifiOpen ? (
                            <Notifiactions updateFriendList={updateFriendList}
                                currentUserId={currentUserId}
                                socket={socket} setIsNotifiOpen={setIsNotifiOpen} currUserData={currUserData} />
                        ) : null
                    }

                    {/* Video Call */}
                    {
                        initializeCall ? (<VideoCall socket={socket} isInComingCall={isInComingCall} setIsInComingCall={setIsInComingCall} />) : null
                    }



                </div>

                {/* Mobile navigation bar */}
                <div style={showMessageComponent ? { display: "none" } : { display: "block" }} className="mobile-nav-container">
                    <div className="mobile-nav">
                        <div onClick={openChatComponent} style={showChatComponent ? { borderBottomColor: "#fff", color: "#fff" } : { borderBottomColor: "transparent", color: "#dadada" }} className="mobile-nav-btn">
                            <FontAwesomeIcon icon={faCommentDots} />
                        </div>
                        <div onClick={openSearchUserComponent} style={isSearchFormOpen ? { borderBottomColor: "#fff", color: "#fff" } : { borderBottomColor: "transparent", color: "#dadada" }} className="mobile-nav-btn">
                            <FontAwesomeIcon icon={faUserPlus} />
                        </div>
                        <div onClick={openNotificationComponent}
                            style={isNotifiOpen ? { borderBottomColor: "#fff", color: "#fff" } :
                                { borderBottomColor: "transparent", color: "#dadada" }} className="mobile-nav-btn notifi-bell">
                            <FontAwesomeIcon icon={faBell} />
                            {notificationArray.length > 0 ? (<span>+{notificationArray.length}</span>) : null}
                        </div>
                        <div onClick={openProfileComponent} style={showProfileComponent ? { borderBottomColor: "#fff", color: "#fff" } : { borderBottomColor: "transparent", color: "#dadada" }} className="mobile-nav-btn">
                            <FontAwesomeIcon icon={faCircleUser} />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <h1>Fetching Data...</h1>
        )

    )

}
