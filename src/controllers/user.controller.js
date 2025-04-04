import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

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

export {registerUser, loginUser, logoutUser}; // to export the registerUser function