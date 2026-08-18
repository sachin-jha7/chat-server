import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import NotificationCard from "./NotificationCard";
import { useContext, useEffect } from "react";
import { DataContext } from "../context/DataContext";

export default function Notifiactions({ updateFriendList, currentUserId, socket, setIsNotifiOpen, currUserData }) {
    const { notificationArray, setNotificationArray } = useContext(DataContext);

    const removeNotification = (whoSentRequest, userId) => {
        // console.log(`remove this user: ${whoSentRequest}`)

        const eventSendingTime = performance.now(); // sent at 12:00
        socket.emit("remove-notification", ({ whoSentRequest, userId })); // update the DB


        socket.on("notification-deleted", (data) => { // remove notification card
            const eventReceivingTime = performance.now(); // receive at 12:05
            const timeElapsed = eventReceivingTime - eventSendingTime;
            if (timeElapsed > 800) {
                setNotificationArray((prev) => prev.filter((prev) => prev._id != whoSentRequest));
            } else {
                setTimeout(() => {
                    setNotificationArray((prev) => prev.filter((prev) => prev._id != whoSentRequest));
                }, 800);
            }
        });
    }

    useEffect(() => {

        const handler = (userData) => {
            setNotificationArray(prev => [...prev, userData]);
        };
        socket.on("listen-request", handler);

        return () => {
            socket.off("listen-request", handler);
        };

    }, []);

    useEffect(() => {
        const handler = (userId) => {
            setNotificationArray((prev) => prev.filter((prev) => prev._id != userId))
        }
        socket.on("pull-notification", handler);
        return () => {
            socket.off("pull-notification", handler);
        };
    }, [])


    useEffect(() => {
        if (currUserData) {
            setNotificationArray(currUserData.myNotifications);
        }
    }, [currUserData]);
    return (
        <div className="notification-div">
            <h2>Notifiactions
                <button onClick={() => setIsNotifiOpen(false)} className='close-notifi-div'><FontAwesomeIcon icon={faTimes} /></button>

            </h2>
            <div className="notification-container">
                {
                    notificationArray.map((data) => {
                        return <NotificationCard key={data._id} updateFriendList={updateFriendList}
                            deleteNotification={removeNotification} notifiData={data}
                            userId={currentUserId} socket={socket} />
                    })
                }
            </div>
        </div>
    )
}