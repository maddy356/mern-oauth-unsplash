import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true, index: true },
    name: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
