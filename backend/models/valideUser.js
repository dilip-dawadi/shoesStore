import mongoose, { Schema } from "mongoose";
const tokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "UserDetails",
        unique: true,
    },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 1440 },
});
const verifyUser = mongoose.model("VerifyedUser", tokenSchema);
export default verifyUser;
