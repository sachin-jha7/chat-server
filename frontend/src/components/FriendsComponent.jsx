import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideoCamera, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useRef } from "react";
import { DataContext } from '../context/DataContext';

export default function FriendsComponent({ currUserData, socket }) {

    const { setInitializeCall, setIsSeen, onlineUsers, setOnlineUsers, setSelectChat, setMessage, 
        setShowMessageComponent, showChatComponent, setShowChatComponent } = useContext(DataContext);
    const currentRoomName = useRef(null);
    useEffect(() => {

        const handleUserStatus = (data) => {

            setOnlineUsers(() => ({ ...data }));

        }
        socket.on("user-status-changed", handleUserStatus);

        return () => {
            socket.off("user-status-changed", handleUserStatus);
        };
    }, [socket]);

    const startChat = async (data) => {
        if (window.innerWidth <= 630) {
            setShowMessageComponent(true);
            setShowChatComponent(false);
        }
        if (currentRoomName.current) {
            socket.emit("leave-current-chat-room", currentRoomName.current);
        }

        const UserId = currUserData.currentUser;
        const clickedUser = data._id;
        const roomName = [clickedUser, UserId].sort().join("_");
        setSelectChat({ data, roomName, onlineUsers });
        socket.emit("join-chat-room", { roomName, UserId, clickedUser });
        currentRoomName.current = roomName;
        setMessage([]);
        const res = await fetch("http://localhost:4040/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: `${roomName}` }),
            credentials: "include"
        });
        const result = await res.json();
        currentRoomName.current = roomName;
        setMessage(result);
        setIsSeen(false);
    }


    const startVideoCall = async (event, data) => {
        event.stopPropagation();
        const callerUserId = currUserData.currentUser;
        const callerImageUrl = currUserData.imageUrl;
        const callerUserName = currUserData.fullName;
        if (window.innerWidth <= 630) {
            setShowMessageComponent(true);
            setShowChatComponent(false);
        }
        setInitializeCall({ data, callerUserId, callerImageUrl, callerUserName, caller: true });
        socket.emit("start-video-call", { data, callerUserId, callerImageUrl, callerUserName, caller: true });
        // console.log(data._id)
    }


    return (
        <div style={showChatComponent ? { display: "flex" } : { display: "none" }} className="friend-section">
            <h2>Your Friends</h2>
            <div className="friend-list-container">

                {
                    currUserData.friendsList.length === 0 ? (
                        <h3 style={{ margin: "auto", marginTop: "40px" }}>You don't have any friends,
                        {window.innerWidth > 630 ? " Try Find People" : <> click on <FontAwesomeIcon icon={faUserPlus} /></>}</h3>
                    ) : null
                }

                {
                    currUserData.friendsList.map((data) => {
                        return (
                            <div onClick={() => startChat(data)} key={data._id} className="user">
                                <div>
                                    <div className="user-img">
                                        <img src={data.imageUrl} />
                                    </div>
                                    <div className="user-info">
                                        <p className="user-name">{data.fullName}</p>
                                        <p className="user-status">
                                            {
                                                onlineUsers[data._id]
                                                    ? "Online"
                                                    : "Offline"
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div onClick={(event) => startVideoCall(event, data)} className="video-call">
                                    <FontAwesomeIcon icon={faVideoCamera} />
                                </div>
                            </div>

                        )
                    })

                }

            </div>
        </div>
    )
}
