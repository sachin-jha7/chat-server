import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const messageSchema = new Schema({
    roomName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Message = mongoose.model("Message", messageSchema);

export default Message;