import Message from "../models/message.js";

export const getMessage = async (req, res) => {
    const { id } = req.body;
    const userMessage = await Message.find({ roomName: id });
    res.status(200).json(userMessage);
}