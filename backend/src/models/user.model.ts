import mongoose, { type Document, Schema } from "mongoose";

interface IUser extends Document {
  address: string;
  avatar: string;
  username: string;
  bio: string;
}

const UserSchema = new Schema<IUser>(
  {
    address: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
    username: { type: String, unique: true, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
