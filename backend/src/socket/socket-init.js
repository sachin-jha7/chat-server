import { Server } from "socket.io";
import { registerVideoCallEvents } from "./video-call-socket.js";
import { registerFriendReqEvents } from "./friend-req-socket.js";
import { registerChatEvents } from "./chat-socket.js";
import { registerOnlineOfflineEvents } from "./onlineUsers-socket.js";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        // console.log("User connected:", socket.id);

        // Add different Events
        registerOnlineOfflineEvents(io, socket);
        registerFriendReqEvents(io, socket);
        registerChatEvents(io, socket);
        registerVideoCallEvents(io, socket);

        
    });
    // return io;
}