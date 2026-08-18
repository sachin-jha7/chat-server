
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { useContext, useRef, useState } from 'react';
import { Cropper } from 'react-cropper';
import "cropperjs/dist/cropper.css"; // Required styles
import { DataContext } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';


export default function ProfileComponent({ currUserData, setCurrUserData }) {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const cropperRef = useRef(null);
    const [uploadBtnState, setUploadBtnState] = useState('idle');

    const { openProfile, setOpenProfile, showProfileComponent } = useContext(DataContext);

    const logoutUser = async () => {
        const res = await fetch("http://localhost:4040/logout", {
            credentials: "include"
        });
        const result = await res.json();
        // console.log(result)
        if (result === "Logged Out successfully") {
            // console.log("Navigating...")
            setCurrUserData(null);
            navigate("/");
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        // console.log(file)
        setUploadBtnState("idle");
        if (file) {
            // const reader = new FileReader();
            // reader.onload = () => setImage(reader.result);
            // reader.readAsDataURL(file);
            if (image) URL.revokeObjectURL(image);
            const blobUrl = URL.createObjectURL(file);
            setImage(blobUrl);
        }
    }

    const handleGetCropData = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            // Get Base64 Data URL (Good for previews)
            // const dataUrl = cropper.getCroppedCanvas().toDataURL();
            // setCroppedResult(dataUrl);

            // Alternative: Get a Blob file (Best for API server uploads)
            setUploadBtnState('uploading');
            cropper.getCroppedCanvas().toBlob(async (blob) => {
                // console.log(blob); // Send this blob to your server backend
                const formData = new FormData();
                formData.append("image", blob);
                const res = await fetch("http://localhost:4040/upload", {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                });
                const result = await res.json();
                // console.log(result);
                if (result.message == "Upload successful") {
                    currUserData.imageUrl = result.url;
                }
                setUploadBtnState('uploaded');
                setTimeout(() => {
                    setImage(null);
                }, 250);
            }, "image/jpeg");

        }
    };

    let profileStyle;
    if (window.innerWidth <= 630) {
        profileStyle = showProfileComponent ? { display: "block" } : { display: "none" };
    } else {
        profileStyle = openProfile == "onFullScreen" ? null : { left: "50%" };
    }

    return (
        <div style={profileStyle} className="profile-section">
            <div className="profile-nav">
                <button onClick={() => setOpenProfile("onFullScreen")} className='close-profile-btn'><FontAwesomeIcon icon={faTimes} /></button>
                <h2>{currUserData.fullName}</h2>
                <button onClick={logoutUser} className='logout-link'>Logout</button>
            </div>
            <div className="user-profile">
                <img src={currUserData.imageUrl} alt="" />
                <label htmlFor="image">Edit</label>
                <input onChange={handleFileChange} type="file" accept="image/*" id="image" hidden={true} />
            </div>
            {image && (
                <div className='image-cropper'>

                    <button onClick={() => setImage(null)} className='close-cropper-btn'><FontAwesomeIcon icon={faTimes} /></button>
                    <div className="cropper-wrapper">
                        <Cropper
                            src={image}
                            className="cropper"
                            initialAspectRatio={1}
                            aspectRatio={1}
                            guides={true}
                            ref={cropperRef}
                            viewMode={1}
                            background={false}
                            responsive={true}
                        />
                    </div>
                    {
                        uploadBtnState == 'idle' ? (
                            <button className='img-upload-btn' onClick={handleGetCropData}>Upload</button>
                        ) : uploadBtnState == 'uploading' ? (
                            <button className='img-upload-btn' style={{ width: "140px" }} disabled={true}>Uploading <FontAwesomeIcon className="force-spin" icon={faCircleNotch} /></button>
                        ) : (
                            <button className='img-upload-btn btn-success' disabled={true}>&#10004; Uploaded</button>
                        )
                    }

                </div>
            )}
        </div>

    )
}