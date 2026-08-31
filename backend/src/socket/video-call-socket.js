export const registerVideoCallEvents = (io, socket) => {
    // Video Call

    socket.on("start-video-call", (data) => {
        // console.log(`start video call ${data.data._id}`)
        socket.to(data.data._id).emit("listen-video-call", data);
    });

    socket.on("send-SDP-offer-from-caller", (data) => {
        // console.log(data)
        const sdpOffer = data.sdpOffer;
        const callerId = data.initializeCall.callerUserId;
        const clickedUser = data.initializeCall.data._id;
        socket.to(clickedUser).emit("get-SDP-offer-from-caller", { sdpOffer, callerId });
    });

    socket.on("send-SDP-answer-to-server", (data) => {
        // console.log(data);
        socket.to(data.callerId).emit("get-remote-peer-SDP-answer", data.sdpAnswer);
    });

    socket.on("send-ice-candidate-from-caller", (data) => {
        // console.log("executed")
        const iceCandidate = data.iceCandidate;
        const clickedUser = data.initializeCall._id;
        // console.log(iceCandidate)
        socket.to(clickedUser).emit("get-ice-candidate-from-server", { iceCandidate });
    });

    socket.on("send-ice-candidate-from-receiver", (data) => {
        const iceCandidate = data.iceCandidate;
        const callerId = data.initializeCall.callerUserId;
        // console.log(iceCandidate)
        socket.to(callerId).emit("get-ice-candidate-from-server", { iceCandidate })
    });

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
    });

    socket.on("call-accepted", (data) => {
        const callerId = data.callerUserId;
        socket.to(callerId).emit("receiver-accepts-the-call", data);
    });
}