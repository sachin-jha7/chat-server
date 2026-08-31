import { cloudinary } from "../config/cloud-config.js";


export const uploadImage = (file) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "chat-app-react",
                resource_type: 'image'
            },
            (error, result) => {

                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        stream.end(file.buffer);
    });
}