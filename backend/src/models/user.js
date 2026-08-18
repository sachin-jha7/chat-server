import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/3840px-User-avatar.svg.png"
    },
    myNotifications: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    requestSent: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    keyWords: [
        String
    ],
    normalizedName: {
        type: String
    }
});

const User = mongoose.model("User", userSchema);

export default User;