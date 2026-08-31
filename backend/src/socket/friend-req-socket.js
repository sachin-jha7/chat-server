import User from "../models/user.js";
import Friend from "../models/friend.js";

export const registerFriendReqEvents = (io, socket) => {

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
}