import { createContext, useState } from "react";
import { io } from 'socket.io-client';
const socket = io("http://localhost:4040", { autoConnect: false, credentials: "include" });
let currentUserId;

export const DataContext = createContext();

export function DataProvider({ children }) {

    // const [currUserData, setCurrUserData] = useState(null);
    const [selectChat, setSelectChat] = useState(null);
    const [message, setMessage] = useState([]);
    const [openProfile, setOpenProfile] = useState("onFullScreen");
    const [notificationArray, setNotificationArray] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [isSeen, setIsSeen] = useState(false);
    const [initializeCall, setInitializeCall] = useState(null);

    


    // For small screen navigation
    const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
    const [isNotifiOpen, setIsNotifiOpen] = useState(false);
    const [showChatComponent, setShowChatComponent] = useState(true);
    const [showProfileComponent, setShowProfileComponent] = useState(false);
    const [showMessageComponent, setShowMessageComponent] = useState(false);

    return (
        <DataContext.Provider value={{
            initializeCall, setInitializeCall,
            isSeen, setIsSeen,
            onlineUsers, setOnlineUsers,
            selectChat, setSelectChat, message,
            setMessage, openProfile, setOpenProfile, notificationArray,
            setNotificationArray, showChatComponent, setShowChatComponent,
            showProfileComponent, setShowProfileComponent,
            showMessageComponent, setShowMessageComponent,
            isSearchFormOpen, setIsSearchFormOpen,
            isNotifiOpen, setIsNotifiOpen
        }} >
            {children}
        </DataContext.Provider>
    )
}