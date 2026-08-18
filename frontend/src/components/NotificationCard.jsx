import { useState } from "react";


export default function NotificationCard({ notifiData, socket, userId, deleteNotification }) {
    const [requestAcceptedState, setRequestAcceptedState] = useState("idle");

    const rejectRequest = (whoSentRequest) => {
        setRequestAcceptedState("rejected");
        deleteNotification(whoSentRequest, userId);
    }
    const requestAccepted = (whoSentRequest, imageUrl, fullName) => {
        setRequestAcceptedState("accepted");
        socket.emit("request-accepted", ({ whoSentRequest, userId }));
        deleteNotification(whoSentRequest, userId);
        // whoSentRequest,imageUrl,fullName :: these are sender info
        socket.emit("update-friend-list", ({ whoSentRequest, imageUrl, fullName, userId }));
    }
    return (


        <div key={notifiData._id} className="notification-card">
            <div className="requested-user-img">
                <img src={notifiData.imageUrl} />
            </div>
            <p><b>{notifiData.fullName}</b> has sent you connection request.</p>
            <div className="accept-reject-btns">
                {
                    requestAcceptedState == "idle" ? (
                        <>
                            <button onClick={() => requestAccepted(notifiData._id, notifiData.imageUrl, notifiData.fullName)} className='accept-btn'>&#10004;Accept</button>
                            <button onClick={() => rejectRequest(notifiData._id)} className='reject-btn'>&#10008;Reject</button>
                        </>
                    ) : requestAcceptedState == "accepted" ? (
                        <button className='accept-btn'>&#10004;Accepted</button>
                    ) : (
                        <button className='reject-btn'>&#10008;Rejected</button>
                    )
                }
            </div>
        </div>

    )
}