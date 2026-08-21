import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faBars, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useContext, useRef, useEffect, useState } from "react";
import { DataContext } from '../context/DataContext';


export default function ChatComponent({ currUserData, socket }) {

    // const isTyping = useRef(false);
    const { isSeen, setIsSeen, selectChat, setMessage, setOpenProfile, onlineUsers,
        message, showMessageComponent, setShowMessageComponent, setShowChatComponent } = useContext(DataContext);


    const [isTyping, setIsTyping] = useState(false);
    const timeoutRef = useRef(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

    const moveBackToChatComponent = () => {
        setShowMessageComponent(false);
        setShowChatComponent(true);
    }


    const handleInputChange = () => {
        if (!isTyping) {
            setIsTyping(true);
            socket.emit("user-is-typing", selectChat);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit("user-stop-typing", selectChat)
        }, 1500);
    }
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    }, []);


    useEffect(() => {
        const handler = (data) => {
            setIsOtherUserTyping(false);
        }
        socket.on("user_stop_typing", handler);
        return () => {
            socket.off("user_stop_typing", handler);
        }
    }, []);

    useEffect(() => {
        const handler = (data) => {
            setIsOtherUserTyping(true);
        }
        socket.on("user_is_typing", handler);
        return () => {
            socket.off("user_is_typing", handler);
        }
    }, []);

    useEffect(() => {
        const isMessageSeen = (joiningTime) => {
            const currentUserId = currUserData.currentUser;
            const myMessages = message.filter((message) => message.sender == currentUserId) || [];
            const lastMessage = myMessages[myMessages.length - 1];
            if (lastMessage) {
                const lastMessageTime = (lastMessage.createdAt);
                if (joiningTime > lastMessageTime) {
                    setIsSeen(true);
                } else {
                    setIsSeen(false);
                }
            }
        }
        socket.on("receiver-chat-room-joining-time", isMessageSeen);
        return () => {
            socket.off("receiver-chat-room-joining-time", isMessageSeen);
        }
    }, [message]);

    const msgSender = (event, roomName) => {
        event.preventDefault();
        const UserId = currUserData.currentUser;
        const msg = event.target[0].value;
        if (msg == "") {
            return;
        }
        setMessage((prev) => [...prev, { text: msg, sender: UserId }]);
        socket.emit("send-message-to-server", { msg, roomName, UserId });
        event.target[0].value = "";
    }

    useEffect(() => {
        const handleMessageSeen = (data) => {
            setIsSeen(data);
        }
        socket.on("user-is-in-chat?", handleMessageSeen);
        return () => {
            socket.off("user-is-in-chat?", handleMessageSeen);
        }
    }, []);

    // Show message in real time
    useEffect(() => {
        const handler = (data) => {
            setMessage((prev) => [...prev, { text: data, sender: "server" }]);
        }
        socket.on("receive-message-from-server", handler);
        return () => {
            socket.off("receive-message-from-server", handler);
        };
    }, []);

    // Scroll the chat screen at bottom
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [message]);

    return (
        <div style={showMessageComponent ? { display: "flex" } : { display: "none" }} className="chat-section">
            {
                selectChat ? (
                    <>
                        <div className="user-chat-nav">
                            <button onClick={moveBackToChatComponent} className="close-chat-btn"><FontAwesomeIcon icon={faArrowLeft} /></button>
                            <div className="selected-user-img">
                                <img src={selectChat.data.imageUrl} />
                            </div>
                            <p className='selected-user-name'>{selectChat.data.fullName}</p>
                            {
                                isOtherUserTyping ? (
                                    <span >Typing...</span>
                                ) : (
                                    <span>{onlineUsers[selectChat.data._id] ? "Online" : "Offline"}</span>
                                )
                            }


                            <button onClick={() => setOpenProfile("onMediumScreen")} className='profile-opener'><FontAwesomeIcon icon={faBars} /></button>
                        </div>
                        <div className="user-msg-wrapper">

                            {
                                message.map((data, idx) => {
                                    if (data.sender == currUserData.currentUser) {
                                        return (
                                            <div key={idx} className="right-msg msg">{data.text}</div>
                                        )
                                    } else {
                                        return (
                                            <div key={idx} className="left-msg msg">{data.text}</div>
                                        )
                                    }

                                })
                            }
                            {isSeen ? (<span className="msg-seen-text">seen</span>) : null}
                            <div ref={bottomRef}></div>
                        </div>
                        <form onSubmit={(event) => msgSender(event, selectChat.roomName)} className='chat-msg-form'>

                            <input onChange={handleInputChange} autoComplete='off' type="text" placeholder='Message...' />
                            <button><FontAwesomeIcon icon={faPaperPlane} /></button>
                        </form>
                    </>
                ) : (
                    <>
                        <button style={{ marginTop: "20px" }} onClick={() => setOpenProfile("onMediumScreen")} className='profile-opener'><FontAwesomeIcon icon={faBars} /></button>
                        <h3 style={{ margin: "auto" }}>No Chat selected!</h3>
                    </>
                )
            }

        </div>
    )
}
