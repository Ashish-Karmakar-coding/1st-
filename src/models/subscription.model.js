import mongoose, {Schema} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribin
        ref: 'User',
    },
    channel: {
        type: Schema.Types.ObjectId, // channel to which the user is subscribing
        ref: 'User',
    },

},{timestamps: true}); // to add timestamps to the schema 

const Subscription = mongoose.model('Subscription', subscriptionSchema);