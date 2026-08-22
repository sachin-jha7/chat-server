import './env.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://chat-server-five-jet.vercel.app",
        credentials: true
    }
});
import mongoose from 'mongoose';
import auth from './src/middleware/auth.js';
import User from './src/models/user.js';
import Friend from './src/models/friend.js';
import jwt from 'jsonwebtoken'
import Message from './src/models/message.js';
import { cloudinary, upload } from './src/config/cloud-config.js';
import ChatRoom from './src/models/chatRoom.js';
// import { userInfo } from 'node:os';

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });


app.use(cors({
    origin: "https://chat-server-five-jet.vercel.app",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// Index Route

app.get("/", auth.verify, async (req, res) => {

    const userId = req.user.id;
    const userDoc = await User.findById(userId);
    const user = await User.findById(userId)
        .select('myNotifications')
        .populate('myNotifications', 'fullName imageUrl');

    const notifications = user.myNotifications;


    const allFriendshipArray = await Friend.find({
        friends: userId
    }).populate("friends", "fullName imageUrl");

    // allFriendshipArray will return data something like 
    // = [{ friends: [{ data1 }, { data2 }] }, { friends: [{ data3 }, { data4 }]}]

    const flatArray = allFriendshipArray.flatMap(item => item.friends); // this will make them [{data1},{data2},{data3},{data4}]
    // console.log(flatArray)
    const filteredResult = flatArray.filter(item => item._id != userId); // only those user which are friend of current user
    // console.log(filteredResult)

    const currUserData = {
        fullName: userDoc.fullName,
        imageUrl: userDoc.imageUrl,
        currentUser: userDoc._id,
        myNotifications: notifications,
        friendsList: filteredResult
    }
    res.status(200).json(currUserData);
});

app.post("/search", auth.verify, async (req, res) => {
    // console.log(req.body)
    let { searchedName } = req.body;
    searchedName = searchedName.trim();
    const currentUserId = req.user.id;
    const isEmpty = searchedName.trim().length === 0;
    if (isEmpty) {
        return res.status(422).json("Invalid Data");
    }

    const hasWhiteSpace = /\s/.test(searchedName);
    if (hasWhiteSpace) {
        let searchableName = searchedName.trim().split(/\s+/);
        searchableName = searchableName.join(" ").toUpperCase();

        // const searchedUserDoc = await User.find({
        //     normalizedName: searchableName,
        //     _id: { $ne: currentUserId }
        // });

        // 1. Find all relation documents where currentUserId is in the friends array
        const relationDocs = await Friend.find({ friends: currentUserId });

        // 2. Extract and flatten all user IDs from all returned relation documents
        const allFriendIds = relationDocs.flatMap(doc => doc.friends);

        // 3. Combine currentUserId and all friend IDs into a single exclusion set
        // (Using Set removes duplicate IDs automatically)
        const excludeIds = Array.from(new Set([currentUserId, ...allFriendIds.map(id => id.toString())]));

        // 4. Search users excluding yourself and existing friends
        const searchedUserDoc = await User.find({
            normalizedName: searchableName,
            _id: { $nin: excludeIds }
        });


        const currentUserDoc = await User.findById(currentUserId);
        const currUserReqSentArray = currentUserDoc.requestSent;

        const userResult = {
            searchedUserDoc,
            currUserReqSentArray
        }


        return res.status(200).json(userResult);

    } else {
        const searchedWords = searchedName.toUpperCase();

        // 1. Find all relation documents where currentUserId is in the friends array
        const relationDocs = await Friend.find({ friends: currentUserId });

        // 2. Extract and flatten all user IDs from all returned relation documents
        const allFriendIds = relationDocs.flatMap(doc => doc.friends);

        // 3. Combine currentUserId and all friend IDs into a single exclusion set
        // (Using Set removes duplicate IDs automatically)
        const excludeIds = Array.from(new Set([currentUserId, ...allFriendIds.map(id => id.toString())]));

        // 4. Search users excluding yourself and existing friends
        const searchedUserDoc = await User.find({
            keyWords: searchedWords,
            _id: { $nin: excludeIds }
        });

        const currentUserDoc = await User.findById(currentUserId);
        // console.log(currentUserDoc.requestSent);
        const currUserReqSentArray = currentUserDoc.requestSent;

        const userResult = {
            searchedUserDoc,
            currUserReqSentArray
        }


        return res.status(200).json(userResult);

        // return res.status(200).json(searchedUserDoc);
    }
});

app.post("/chat", auth.verify, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.body;
    const userMessage = await Message.find({ roomName: id });
    res.status(200).json(userMessage);
});

app.post("/upload", auth.verify, upload.single("image"), (req, res) => {
    const currentUserId = req.user.id;
    try {
        if (!req.file) {
            return res.status(500).json("Error: No file");
        }
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "chat-app-react",
            resource_type: 'image'
        },
            async (error, result) => {
                if (error) {
                    console.log("Cloudinary upload error: ", error);
                    return res.status(500).json({ error: "Cloudinary upload failed" });
                }
                const currentUserDoc = await User.findById(currentUserId);
                currentUserDoc.imageUrl = result.secure_url;
                await currentUserDoc.save();

                res.status(200).json({ message: "Upload successful", url: result.secure_url });
            }
        );
        uploadStream.end(req.file.buffer);
    } catch (err) {
        res.status(500).json(`Error: ${err.message}`);
    }
})

app.post("/signup", auth.signup);

app.post("/login", auth.login);

app.get("/logout", auth.logout);



// WEB SOCKET THINGS

const onlineUsers = new Map();

io.on("connection", (socket) => {
    // console.log(`A user connected:`, socket.id);

    let currUserId = null;
    socket.on("register-user", (currentUser) => {

        currUserId = currentUser;
        // console.log(`User: ${currUserId} is online`);
        onlineUsers.set(currUserId, socket.id);
        socket.join(currentUser);
        io.emit("user-status-changed", Object.fromEntries(onlineUsers));
        // console.log("user joined room", currentUser)
    });

    socket.on("disconnect", () => {
        if (currUserId) {
            if (onlineUsers.get(currUserId) === socket.id) {
                // console.log(`User: ${currUserId} is offline`);
                // console.log(onlineUsers)
                onlineUsers.delete(currUserId);
                io.emit("user-status-changed", Object.fromEntries(onlineUsers));
            }
        }
    });

    socket.on("user-is-typing", (data) => {
        // console.log(data.data._id);
        // console.log(data.roomName);
        socket.to(data.roomName).emit("user_is_typing", data.data._id);
    })

    socket.on("user-stop-typing", (data) => {
        socket.to(data.roomName).emit("user_stop_typing", data.data._id);
    })



    socket.on("friend-request", async ({ id, currentUser }) => {  // server has to find the user (using this id) to push notification
        // console.log("Listenting request");
        const userWhoSentReq = await User.findById(currentUser);
        if (userWhoSentReq) {
            const userData = {
                _id: currentUser,
                fullName: userWhoSentReq.fullName,
                imageUrl: userWhoSentReq.imageUrl
            }
            // console.log(id)
            socket.to(id).emit("listen-request", userData); // sending event to a user's room
        }

        userWhoSentReq.requestSent.push(id);
        await userWhoSentReq.save();

        const userWhoGetNotifi = await User.findById(id);
        userWhoGetNotifi.myNotifications.push(currentUser);
        await userWhoGetNotifi.save();
    });

    socket.on("request-accepted", async (data) => {
        // console.log(data)
        let currentUserId = data.userId;
        let whoSentRequest = data.whoSentRequest;
        // currentUserId = new mongoose.Types.ObjectId(currentUserId);
        // whoSentRequest = new mongoose.Types.ObjectId(whoSentRequest);
        const newFriend = new Friend({
            friends: [
                currentUserId,
                whoSentRequest
            ]
        });
        await newFriend.save();

    })

    socket.on("remove-notification", async ({ whoSentRequest, userId }) => {
        // const currentUserDoc = await User.findById(userId);
        // console.log(currentUserDoc.myNotifications)
        const updatedArray = await User.findByIdAndUpdate(
            userId,
            { $pull: { myNotifications: whoSentRequest } },
        );
        const updateReqSentArray = await User.findByIdAndUpdate(
            whoSentRequest,
            { $pull: { requestSent: userId } }
        )
        socket.emit("notification-deleted", "Deleted");
    })

    socket.on("withdraw-request", async (data) => {
        const userWhoseCardClicked = data.id;
        const userWhoPulledRequest = data.currentUser;
        await User.findByIdAndUpdate(
            userWhoseCardClicked,
            { $pull: { myNotifications: userWhoPulledRequest } }
        );
        await User.findByIdAndUpdate(
            userWhoPulledRequest,
            { $pull: { requestSent: userWhoseCardClicked } }
        );
        socket.to(userWhoseCardClicked).emit("pull-notification", userWhoPulledRequest);
    });

    // When request is accepted
    socket.on("update-friend-list", async ({ whoSentRequest, imageUrl, fullName, userId }) => {
        const currentUserDoc = await User.findById(userId);
        // console.log(currentUserDoc)
        const currentUserInfo = {
            fullName: currentUserDoc.fullName,
            imageUrl: currentUserDoc.imageUrl,
            userId: userId
        }
        socket.to(whoSentRequest).emit("update-sender-friend-list", currentUserInfo);
        io.to(userId).emit("update-receiver-friend-list", { whoSentRequest, fullName, imageUrl });
    })

    // when a chat is selected
    socket.on("join-chat-room", async (data) => {
        socket.join(data.roomName);
        // console.log("user joined Chat-Room: ", data.roomName);
        const userWhoClickedToJoinRoom = await ChatRoom.findOneAndUpdate({  // The Sender
            roomName: data.roomName,
            userWhoJoined: data.UserId
        },
            {
                $set: { joiningTime: new Date() } // Forces the new timestamps
            },
            {
                upsert: true, //Creates document if it doesn't exist
                returnDocument: 'after'
            });

        
        const clickedUserRoomJoinInfo = await ChatRoom.findOne({  // The receiver
            $and: [
                { userWhoJoined: data.clickedUser },
                { roomName: data.roomName }
            ]
        });
        const joiningTime = new Date(clickedUserRoomJoinInfo?.joiningTime);
        socket.emit("receiver-chat-room-joining-time", joiningTime);
        
    });

    // leave previous chat room
    socket.on("leave-current-chat-room", (roomName) => {
        socket.leave(roomName)
    });

    async function isUserInChatRoom(userId, chatRoomName) {
        const userSockets = await io.in(userId).fetchSockets(); //fetch all sockets inside the user's personal room

        if (userSockets.length === 0) {
            return false; // this means user is offline
        }

        const isInRoom = userSockets.some(socket => socket.rooms.has(chatRoomName));

        return isInRoom;
    }

    // Send message to other user in a room
    socket.on("send-message-to-server", async (data) => {
        const roomName = data.roomName;
        const senderId = data.UserId;
        const roomNameArray = roomName.split("_");
        let receiverId = roomNameArray.filter((id) => id != senderId);
        receiverId = receiverId[0];
        // console.log(`Receiver Id: ${receiverId}`);
        // console.log(`Sender Id: ${senderId}`);
        const newMessage = await Message.create({
            roomName: roomName,
            text: data.msg,
            sender: senderId,
            receiver: receiverId
        });
        const userPresent = await isUserInChatRoom(receiverId, roomName);
        if (userPresent) {
            const updatedRoom = await ChatRoom.findOneAndUpdate({
                roomName: roomName,
                userWhoJoined: receiverId,
            },
                {
                    $set: { joiningTime: new Date() } // Forces the new timestamps
                },
                {
                    upsert: true, //Creates document if it doesn't exist
                    returnDocument: 'after'
                });
        }
        socket.emit("user-is-in-chat?", userPresent);
        socket.to(roomName).emit("receive-message-from-server", data.msg);



    })

    // Video Call

    socket.on("start-video-call", (data) => {
        // console.log(`start video call ${data.data._id}`)
        socket.to(data.data._id).emit("listen-video-call", data);
    })

    socket.on("send-SDP-offer-from-caller", (data) => {
        // console.log(data)
        const sdpOffer = data.sdpOffer;
        const callerId = data.initializeCall.callerUserId;
        const clickedUser = data.initializeCall.data._id;
        socket.to(clickedUser).emit("get-SDP-offer-from-caller", { sdpOffer, callerId });
    })

    socket.on("send-SDP-answer-to-server", (data) => {
        // console.log(data);
        socket.to(data.callerId).emit("get-remote-peer-SDP-answer", data.sdpAnswer);
    })

    socket.on("send-ice-candidate-from-caller", (data) => {
        // console.log("executed")
        const iceCandidate = data.iceCandidate;
        const clickedUser = data.initializeCall._id;
        // console.log(iceCandidate)
        socket.to(clickedUser).emit("get-ice-candidate-from-server", { iceCandidate });
    })

    socket.on("send-ice-candidate-from-receiver", (data) => {
        const iceCandidate = data.iceCandidate;
        const callerId = data.initializeCall.callerUserId;
        // console.log(iceCandidate)
        socket.to(callerId).emit("get-ice-candidate-from-server", { iceCandidate })
    })

    socket.on("end-the-call", (data) => {
        if (data.caller == true) {
            // console.log("Caller ends the call")
            const receiverId = data.data._id;
            socket.to(receiverId).emit("call-ends", data);
        } else {
            // console.log("Receiver ends the call");
            const callerId = data.callerUserId;
            socket.to(callerId).emit("call-ends", data);
        }
    })

    socket.on("call-accepted", (data) => {
        const callerId = data.callerUserId;
        socket.to(callerId).emit("receiver-accepts-the-call", data);
    })


})



const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`APP IS LIVE AT PORT: ${PORT}`);
});
