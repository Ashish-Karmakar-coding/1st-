import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => { // to generate access and refresh token
    try {
        const user = await User.findById(userId) // to get the user by id
        const accessToken = user.generateAccessToken()// to generate the access token
        const refreshToken = user.generateRefreshToken()// to generate the refresh token 

        user.refreshToken = refreshToken // to set the refresh token6
        await user.save({validateBeforeSave: false}) // to save the refresh token in the database

        return {accessToken, refreshToken} // to return the access token and refresh token

    } catch (error) {
        throw new ApiError(500, "Error generating access token"); // to check for user creation
    }
}
const registerUser =  asyncHandler(async (req, res) => {      // to handle the async function using try catch block
    // Get user's details from frontnend
    // Validation
    // check if the user already exists
    // Check for images and check for avatar
    // Upload them to cloudinary
    // Create a user obejct - create entry in the database
    // Remove password and refresh token field from the response
    // Check for user creation
    // Return the response


    const {fullName, email,username, password} = req.body // to get the user's details from frontend
    // console.log(fullName, email, username, password); // to print the user's details

    // if (fullName === "") {
    //     throw new ApiError(400, "Full name is required"); // to check if the full name is required
    // }

    if ([fullName, email, username , password].some((field)=> field.trim() === "")) {
        throw new ApiError(400, "All fields are required"); // to check if all fields are required
        
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}] // to check if the user already exists
    }).then((user) => {
        if (user) {
            throw new ApiError(400, "User already exists"); // to check if the user already exists
        }
    })

    const avatarLocalPath = req.files?.avatar[0]?.path; // to check for images and check for avatar

    // const coverImageLocalpath = req.files?.coverImage[0]?.path; // to check for images and check for 
    let coverImageLocalPath ;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       const coverImageLocalpath = req.files.coverImage[0].path; // to check for images and check for cover image
    }


    if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar is required"); // to check for avatar
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath); // to upload them to cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalpath); // to upload them to cloudinary

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar"); // to check for avatar
    }

    const user  = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // to remove password and refresh token field from the response
    if (!createdUser) {
        throw new ApiError(500, "Error creating user"); // to check for user creation
    }

    return res.status(201).json(new ApiResponse(200 , createdUser, "User registered succesfully")); // to return the response
})

const loginUser = asyncHandler(async (req, res) => {
    // Get user's details from frontnend
    // Validation
    // Check for user in the database
    // Check for password
    // Generate access token and refresh token
    // Send cookies
    // Return the response

    const {email ,username, password} = req.body // to get the user's details from frontend

    if (!username && !email){
        throw new ApiError(404, "Username or email is required"); // to check if all fields are required
    }

    const user = await User.findOne({$or: [{email}, {username}]}) // to check for user in the database
    if (!User) {
        throw new ApiError(404, "Invalid credentials"); // to check for user in the database 
    }

    const isPasswordValid =  await user.isPasswordModified(password) // to check for password
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials"); // to check for user in the database 
    }


    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // to remove password and refresh token field from the response

    const option = { // options to send cookies
        httpOnly: true, // to make the cookies http only
        secure: true, // to make the cookies secure
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, // to get the user
                accessToken, // to get the access token
                refreshToken // to get the refresh token 
            },
            "User logged in successfully" // to get the message
        )
    ); // to return the response

})

const logoutUser = asyncHandler(async (req, res) => {
    // Clear the cookies
    // Send the response

   await  User.findByIdAndUpdate(req.user._id, 
        {
           $set:{

            refreshToken: undefined // to clear the refresh token

           } 
        }) // to clear the cookies

        const option = { // options to send cookies
            httpOnly: true, // to make the cookies http only
            secure: true, // to make the cookies secure
        }

    return res
    .status(200)
    .clearCookie("accessToken", option) // to clear the access token
    .clearCookie("refreshToken", option) // to clear the refresh token
    .json(
        new ApiResponse(200, null, "User logged out successfully") // to return the response
    )
 
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refresToken // to get the refresh token from the cookies

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required") // to check for refresh token
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET) // to decode the refresh token
    
        const user = await User.findById(decodedToken?._id) // to get the user by id
    
        if (!user) {
            throw new ApiError(400, "Refresh token is required") // to check for refresh token
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, "Invalid refresh token") // to check for refresh token
        }
    
        const option = { // options to send cookies
            httpOnly: true, // to make the cookies http only
            secure: true, // to make the cookies secure
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id) // to generate access token and refresh token
        return res
        .status(200)
        .cookie("accessToken", accessToken, option) // to set the access token
        .cookie("refreshToken", newRefreshToken, option) // to set the refresh token
        .json(
            new ApiResponse(200, {accessToken, newRefreshToken}, "Access token refreshed successfully") // to return the response
        )
    } catch (error) {
        throw new ApiError(400, "Invalid refresh token") // to check for refresh token 
        
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword , newPassword , confirmPassword} =req.body // to get the user's details from frontend

    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "New password and confirm password do not match") // to check if the password is correct    
    }

    const user = await User.findById(req.user._id); // to get the user by id
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) // to check if the password is correct

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect") // to check if the password is correct
    }
    user.password = newPassword // to set the new password
    await user.save({validateBeforeSave: false}) // to save the new password

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully")) // to return the response

})

const getCurrentUser = asyncHandler(async (req, res) => {   
    return res
    .status(200)
    .json(200, req.user , "Current user fetched succesfully ") // to return the response
})

const updateAcountDetails = asyncHandler( async (req,res) => {
    const {fullName , email} = req.body // to get the user's details from frontend

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required") // to check if all fields are required
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName, // to set the full name
                email, // to set the email
            }
        },
        {new: true,} // to get return the updated values   
    ).select("-password") // to remove password and refresh token field from the response


    return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully")) // to return the response


})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path; // to get the file from the request

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required"); // to check for avatar
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath); // to upload them to cloudinary
    if (!avatar.url) {
        throw new ApiError(500, "Error uploading avatar"); // to check for avatar    
    }

    const user =  await User.findByIdAndUpdate(req.user?._id, 
        {
            $set:{
                avatar: avatar.url // to set the avatar
            }
        },
        {new: true,} // to get return the updated values
    ).select("-password") // to remove password and refresh token field from the response

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully")) // to return the response 

})

const updateCoverImage = asyncHandler(async (req, res) => {
    const CoverImageLocalPath = req.file?.path; // to get the file from the request

    if (!CoverImageLocalPath) {
        throw new ApiError(400, "Cover image is required"); // to check for avatar
        
    }

    const coverImage = await uploadOnCloudinary(CoverImageLocalPath); // to upload them to cloudinary
    if (!coverImage.url) {
        throw new ApiError(500, "Error uploading cover image"); // to check for avatar    
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set:{
                coverImage: coverImage.url // to set the avatar
            }
        },
        {new: true,} // to get return the updated values
    ).select("-password") // to remove password and refresh token field from the response

    return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully")) // to return the response 

})

const getUserChannelProfile = asyncHandler(async(req , res) =>{

    const {username} = req.params  // to get the username from the link the user will hit
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([ // to get the channel profile
        {
            $match:{ // to match the username
                username : username?.toLowerCase(),
                
            }
        },
        {
            $lookup:{ // to lookup the user details
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel", // to get the channel id
                as:"subscribers"
            }
        },
        {
            $lookup:{ // to lookup the user details
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber", // to get the subscriber id
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers" // to get the size of the subscribers
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo" // to get the size of the subscribed to
                },
                isSubscribed:{ // to check if the user is subscribed to the channel
                    $cond:{ // condition
                        if:{  
                            $in:[req.user?._id, "$subscribers.subscriber"] // to check if the user is subscribed to the channel
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{ // to project the user details to the frontend
                fullName:1,
                username:1,
                subscribersCount:1,
                isSubscribed:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found") // to check for channel
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    ) // to return the response

})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(user?._id) // to get the user id and mongoose will help to convert the string to object id
            }
        },
        {
            $lookup:{ // to lookup the user details
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
            pipeline:[ // to get the video details
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline : [{ // to get the user details
                            $project: {// to project the user details to the frontend as owner in the form of array 
                                fullName:1,
                                username:1,
                                avatar:1, 
                            },
                        }]
                    } 
                },
                {
                    $addFields:{
                        owner:{
                            $first: "$owner"// to get the first value of the array 
                        }
                    }
                }
            ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully")
    )
})

export {registerUser,
    loginUser, 
    logoutUser , 
    refreshAccessToken , 
    changeCurrentPassword , 
    getCurrentUser , 
    updateAcountDetails,
    updateAvatar,
    updateCoverImage, 
    getUserChannelProfile,
    getWatchHistory }; 