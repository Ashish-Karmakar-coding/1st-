import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
     videoFile:{
        type: String,
        required: true,
        unique: true,   
        index: true
     },
     thumbnail:{
        type: String,
        required: true,
        unique: true,
        index: true
     },
     titel:{
        type: String,
        required: true,
        index: true
     },
     description:{
        type: String,
        required: true,
     },
     duration:{
        type: Number,
        required: true,
     },
     views:{
        type: Number,
        default: 0
     },
     isPublished:{
        type: Boolean,
        default: false
     },
     owner:{
        type:Schema.type.objectId,
        ref: 'User'
     }

},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate); 
export const Video = mongoose.model("Video",videoSchema);