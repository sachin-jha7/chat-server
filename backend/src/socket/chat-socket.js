import ChatRoom from "../models/chatRoom.js";
import Message from "../models/message.js";

export const registerChatEvents = (io, socket) => {

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
    });

    socket.on("user-is-typing", (data) => {
        // console.log(data.data._id);
        // console.log(data.roomName);
        socket.to(data.roomName).emit("user_is_typing", data.data._id);
    });

    socket.on("user-stop-typing", (data) => {
        socket.to(data.roomName).emit("user_stop_typing", data.data._id);
    });
}