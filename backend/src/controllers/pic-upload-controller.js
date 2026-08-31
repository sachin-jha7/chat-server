import { uploadImage } from "../services/pic-upload-service.js";
import User from "../models/user.js";

export const getImageUploaded = async (req, res) => {
    const currentUserId = req.user.id;
    if (!req.file) {
        return res.status(500).json(`Error: No File`);
    }
    const result = await uploadImage(req.file);
    const currentUserDoc = await User.findById(currentUserId);
    currentUserDoc.imageUrl = result.secure_url;
    await currentUserDoc.save();

    res.status(200).json({ message: "Upload successful", url: result.secure_url });

}