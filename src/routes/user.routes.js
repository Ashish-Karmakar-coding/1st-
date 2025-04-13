import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser , updateAcountDetails, updateAvatar , updateCoverImage , getUserChannelProfile , getWatchHistory  } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verify } from "jsonwebtoken";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar", 
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT, logoutUser )
router.route("/refresh-token").post(refreshAccessToken)
router.route("/changed-password").post(verifyJWT,changeCurrentPassword);
router.route("/curret-user").get(verifyJWT,getCurrentUser);
router.route("/update-account-details").patch(verifyJWT,updateAcountDetails);
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"), updateAvatar );
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"), updateCoverImage );
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getWatchHistory);



export default router;