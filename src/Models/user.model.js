import mongoose , {Schema} from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"



const userSchema = new Schema(
    {
        username: {
            type: String , 
            required: true ,
            unique: true , 
            lowercase: true,
            trim: true ,
            index: true
        },
        email: {
            type: String , 
            required: true ,
            unique: true , 
            lowercase: true,
            trim: true 
        },
        fullname: {
            type: String , 
            required: true ,
            trim: true ,
            index: true
        },
        avatar: {
            type: String , // Cloudinary url
            required: true ,
        },
        coverImage: {
            type: String
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String ,
            required: [true , 'Password is required']
        },
        refreshToken: {
            type: String 
        }

},
{timestamps: true}
)


// This will help us to encrypt password
userSchema.pre("save" , async function (next) {
    if(!this.isModified("password")) return next() 

    this.password = bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) // cryptography hai to time lagta hai isiliye await karege iske liye 
}

userSchema.methods.genereateAccessToken = function(){
    return jwt.sign({
        _id: this._id , 
        emial: this.email , 
        username: this.username , 
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET , 
    {
        expiresIn: process.env.ACESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.genereateRefreshToken = function(){
    return jwt.sign({
        _id: this._id 
    },
    process.env.REFRESH_TOKEN_SECRET , 
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User" , userSchema)


// jwt ek bearer token hai , ye token jiske bhi paas haii mai usko data bhej dunga 