import { asyncHandler } from "../Utils/asyncHandler.js";
import {ApiError} from "../Utils/ApiErrors.js"
import {User} from "../Models/user.model.js"
import {uploadOnCloudinary} from "../Utils/cloudinary.js"
import {ApiResponse} from "../Utils/Apiresponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.genereateAccessToken()    // these are methods so be sure to add parenthesis
        const refreshToken = user.genereateRefreshToken()


        // now we need to put refreshToken into the database so the each and every time we dont need to ask the user for his password
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false  }) // this will not ask us everything before saving the token to schema , it will just save that one field , database ka operation time leta haii to save laga doo 

        return {accessToken , refreshToken}


    }
    catch(error){
        throw new ApiError(500 , "Something went wrong while generating refresh and access tokens ")
    }
    
}


const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if the user already exist 
    // check for images , check for avatar
    // upload them to cloudinary , avatar
    // create user object - creatioin call , create entry in db 
    // remove password and refreshtoken field 
    // check for user creation
    // return response or error 


    const {fullname , email , username , password }= req.body
    // console.log("email : " , email);

    // if(fullname === ""){
    //     throw new ApiError(400 , "full name is required")
    // }

    if(
       [fullname , email , username,  password].some((field) => 
       field?.trim() === "")
    ){
       throw new ApiError(400 , "All field are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username } , { email }]
    })

    // console.log("existed user : ", existedUser)
    if(existedUser){
        throw new ApiError(409 , "User with email or username already exist")
    }
    // now lets handle images 
    const avatarLocalPath = req.files?.avatar[0]?.path ; 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    let coverImageLocalPath ; 
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path                                     
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    // now upload them to cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400 , "Avatar file is required")
    }

    // now create object and database me entry kara doo 
    const user = await User.create({
        fullname , 
        avatar: avatar.url , 
        coverImage: coverImage?.url || "", 
        email , 
        password , 
        username: username.toLowerCase()
    })

    // check for user creation now 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // ye karne se ye ye filed user se select nahii hogii 
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    // Now return the response 
    const userobject = createdUser.toObject() ; // we have converted this createduser object to plain JS object before sending the response 
    return res.status(201).json(
        new ApiResponse(200 , userobject , "User registered Successfully")
    )

})


const loginUser = asyncHandler( async (req,res) => {
    // Todos what to do 
    // username base login or email based login
    // find the user
    // password check
    // access and refreshtoken
    // send these token in the form of secure cookies 
    
    const {email , username , password} = req.body

    if(!(username || email)){
        throw new ApiError(400 , "username or password is required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}] // these are mongodb operators
    })

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    // check the password now using bckrpt 
    // also it will take time and the methods we are applying to user are from our system , ie created by us , and the User is the mongodb user so find and so on are mongoose mehtods 
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials")
    }

    // Now listen , if everything is correct then create access and refresh tokens 
    const {accessToken , refreshToken}= await generateAccessAndRefereshTokens(user._id)

    // Now send them in cookies format 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // this was done so that the server do not send the user his password and refreshtoken
    
    const options = {     // by doing this , these cookies will be only modifiable from server side 
        httpOnly: true , 
        secure: true 
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200 , 
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "User logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    // we will have to delete cookies 
    // find the user ,
    // Note , main question is how we will know the user , yaha to apne pass user ka acces nahii hai , I mean he is not giving us the information  
    // We will use the concept of middleware

    await User.findByIdAndUpdate(
        req.user._id,
        {
            // use monogdb operator 
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )

    const options = {     // by doing this , these cookies will be only modifiable from server side 
        httpOnly: true , 
        secure: true 
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json( new ApiResponse(200, {} , "User logged Out"))

})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken , 
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401 , "Invalid refresh Token")
     }
 
     // now the token will be valid , now lets match the token sent by user and the token that is saved in our database 
     if(incomingRefreshToken != user?.refreshToken){
         throw new ApiError(401, "Refresh Token is Expired or used")
     }
 
     // Now if everything is ok genereate the new access token and give it to them , thats it , nothing much 
     const options = {
         httpOnly: true,
         secure: true    
     }
 
     const {accessToken , newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
 
     return res
     .status(200)
     .cookie("access Token" , accessToken , options)
     .cookie("refreshToken" , newrefreshToken , options)
     .json(
         new ApiResponse(
             200 ,
             {accessToken , refreshToken: newrefreshToken},
             "Access Token refreshed"
         )
     )
 
   } catch (error) {
        throw new ApiError(400 , error?.message || "Invalid refresh Token ")
   }

})

export {
    registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken
}