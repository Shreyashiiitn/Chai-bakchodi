import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.contoller.js";
import { upload } from "../Middlewares/multer.middleware.js"
import { verifyJWT } from "../Middlewares/auth.middleware.js";


const router = Router() ; 

router.route("/register").post(
    upload.fields([
        {
            name: "avatar" , 
            maxCount: 1
        },
        {
            name: "coverImage" , 
            maxCount: 1 
        }

    ]),
    registerUser
    )

router.route("/login").post(loginUser)


// secured routes 

router.route("/logout").post(verifyJWT , logoutUser) // this middleware was injected here , this is the only way to inject it in the router 


export default router
