import { ApiError } from "../Utils/ApiErrors.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../Models/user.model.js";

export const verifyJWT  = asyncHandler(async(req, _ ,next) =>{  // when res is not used then we put _
   try {
     // req ke paas cookies ka access hai , given by us using the cookie parser
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
 
     if(!token){
         throw new ApiError(401 , "unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     //user id found and decoded , but we dont wnat some field so we use select 
 
     if(!user){
         throw new ApiError(401 , "Invalid Access Token")
     }
 
     // if we have user then what should we do 
     req.user = user; 
     next()
   } catch (error) {
      throw ApiError(401 , error?.message || "Invalid access token")
   }

})