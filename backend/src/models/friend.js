import mongoose from "mongoose";
import { Schema } from "mongoose";

const friendSchema = new Schema({
    friends: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
});

const Friend = mongoose.model("friend", friendSchema);

export default Friend;