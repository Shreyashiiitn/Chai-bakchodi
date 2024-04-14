import dotenv from "dotenv"

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

console.log(process.env)

connectDB() 
.then(() =>{
    app.listen(process.env.PORT || 8000 , () =>{
        console.log(`App is listening to the port ${process.env.PORT}`) ; 
    }) 
})
.catch((err) =>{
    console.log("MONGO DB connection failed !!" , err) ; 
})




















/*
import express from "express" ; 
const app = express() ; 
;(async() =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error" , (error)=>{
            console.log("ERRR: " , error) ; 
            throw error 
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`App is listening to the port ${process.env.PORT}`)
        })

    }
    catch(error){
        console.log("ERROR: " , error) 
        throw err
    }
}) ()

*/