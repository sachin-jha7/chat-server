import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';




export default function UserCard({ data, reqSent, setCurrUserReqSentArray }) {

    const [requestState, setRequestState] = useState("idle");
    const socket = data.socket;

    const sendRequest = (id) => {
        setRequestState("request-sent");
        const currentUser = data.currentUser;
        socket.emit("friend-request", ({ id, currentUser }));
        // console.log(id);
        setCurrUserReqSentArray((prev) => [...prev, id]);
    }

    const withdrawRequest = (id) => {
        setRequestState("idle");
        const currentUser = data.currentUser;
        socket.emit("withdraw-request", ({ id, currentUser })); // id = that user card's id on which user (the user who search) clicked
        setCurrUserReqSentArray((prev) => prev.filter((requestedIds) => requestedIds != id));
    }
    useEffect(() => {
        // console.log(reqSent)
        if (reqSent) {
            // console.log("requestState = request-sent")
            setRequestState("request-sent");
        } else {
            // console.log("requestState = idle")
            setRequestState("idle");
        }
    }, [reqSent])


    return (
        <div key={data.id} className="user-card">
            <img src={data.imageUrl} alt="user-img" />
            <p>{data.fullName}</p>
            {
                requestState == "idle" ? (
                    <button onClick={() => sendRequest(data.id)} ><FontAwesomeIcon icon={faUserPlus} /> Connect</button>
                ) : (
                    <div>
                        <button className='request-sent-btn'>&#10004; Request sent</button>
                        <button onClick={() => withdrawRequest(data.id)} className='withdraw-btn'>&#10008; Withdraw</button>
                    </div>
                )
            }
        </div>
        
    )
}