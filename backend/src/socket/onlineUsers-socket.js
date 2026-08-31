const onlineUsers = new Map();
export const registerOnlineOfflineEvents = (io, socket) => {
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
                onlineUsers.delete(currUserId);
                io.emit("user-status-changed", Object.fromEntries(onlineUsers));
            }
        }
    });
}