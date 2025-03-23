import asyncHandler from '../middlewares/asyncHandler.js';

const registerUser =  asyncHandler(async (req, res) => {      // to handle the async function using try catch block
    res.status(200).json({
        success: true,
        message: 'Register User'
    })
})

export {registerUser}; // to export the registerUser function