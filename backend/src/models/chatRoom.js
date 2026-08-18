import mongoose from "mongoose";
import { Schema } from "mongoose";

const chatRoomSchema = new Schema({
    roomName: {
        type: String,
        required: true
    },
    userWhoJoined: {
        type: String,
        required: true
    },
    joiningTime: {
        type: Date,
        default: Date.now
    }
});
chatRoomSchema.index(
    { roomName: 1, userWhoJoined: 1 },
    { unique: true }
);

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;