import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express() ; 

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    Credential: true 
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("Public"))

// cookie parser ka yahii kaam hai kii apne isase cookie kar paye aur user ki cookies set kar paye , aur access kar paye 

export{app} 