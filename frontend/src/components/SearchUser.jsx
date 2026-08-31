import UserCard from "./UserCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { DataContext } from '../context/DataContext';
import { useContext, useState } from "react";

export default function SearchUser({ socket, currUserData }) {

    const { setIsSearchFormOpen } = useContext(DataContext);

    const { register, handleSubmit, setValue: setSearchValue } = useForm();
    const [searchedUserInfo, setSearchedUserInfo] = useState([]);
    const [currUserReqSentArray, setCurrUserReqSentArray] = useState([]);
    const [notFound, setNotFound] = useState(false);

    const searchFormHandler = async (data) => {
        const name = { searchedName: data.text };
        if (data.text.trim().length === 0) return;
        const res = await fetch("https://chat-server-70ws.onrender.com/api/chat/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(name),
            credentials: "include"
        });
        const result = await res.json();
        setSearchedUserInfo(result?.searchedUserDoc || []);
        setCurrUserReqSentArray(result?.currUserReqSentArray || []);
        setNotFound(false);
        // console.log(result)
        // console.log(result.currUserReqSentArray);
        if (result.searchedUserDoc.length === 0) {
            setNotFound(true);
        }
        setSearchValue("text", "");
    }

    return (
        <div className="find-people-div">
            <h2>Search & Connect 
                <button onClick={() => setIsSearchFormOpen(false)} type='button' className='find-people-close-btn'><FontAwesomeIcon icon={faTimes} /></button>
            </h2>
            <form onSubmit={handleSubmit(searchFormHandler)} className="user-search-form">
                <input autoComplete='off' type="text" placeholder='Search by name...'
                    {...register("text")} />
                <button className='search-btn'>Search</button>
            </form>
            <div className="search-result-container">

                {
                    notFound ? (
                        <h2>User doesn't exist!</h2>
                    ) : null
                }

                {

                    searchedUserInfo?.map((data) => {
                        const userResult = {
                            id: data._id,
                            imageUrl: data.imageUrl,
                            fullName: data.fullName,
                            socket,
                            currentUser: currUserData.currentUser
                        }


                        const reqSent = currUserReqSentArray.some(id => id == data._id);
                        return <UserCard data={userResult} setCurrUserReqSentArray={setCurrUserReqSentArray} reqSent={reqSent} key={data._id} />
                    })

                }
            </div>
        </div>
    )
}
