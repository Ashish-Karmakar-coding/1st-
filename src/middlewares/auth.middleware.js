import {asyncHandler} from 'express-async-handler';
import {ApiError} from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';

export const verifyJWT = asyncHandler(async(req , res ,next)=>{

    try {
        const token = req.cookies?.accessToken  || req.headers?.authorization?.split("Authorization")?.replace("Bearer ", "")  //to get the token from the cookies or headers
        if(!token){
            throw new ApiError(401, "You are not authorized to access this route")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?.id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "You are not authorized to access this route")
            
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, "You are not authorized to access this route") 
        
    }

})