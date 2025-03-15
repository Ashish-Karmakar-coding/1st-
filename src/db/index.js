import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB = async () => {
     try {
        const conectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`Database connected successfully || DB HOST: ${conectionInstance.connection.host}`);
     } catch (error) {
        console.log("ERROR: ",error);
        process.exit(1);
     }
}

export default connectDB;