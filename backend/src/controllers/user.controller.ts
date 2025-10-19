import { Context } from "elysia";
import User from "../models/user.model.js";
import { IUser } from "../types/types.js";

export const createUser = async (ctx: Context) => {
  try {
    const { address } = ctx.body as IUser;
    const existingUser = await User.findOne({ address });

    if (existingUser) {
      ctx.set.status = 400;
      return { message: "User already exists" };
    }

    const newUser = new User({
      address,
    });

    await newUser.save();

    ctx.set.status = 201;
    return JSON.stringify(newUser);
  } catch (error) {
    ctx.set.status = 500;
    return { message: "internal server error" };
  }
};

export const updateUser = async (ctx: Context) => {
  try {
    const { address, ...updates } = ctx.body as IUser;
    const user = await User.findOneAndUpdate({ address }, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      ctx.set.status = 404;
      return { message: "User not found" };
    }

    ctx.set.status = 200;
    return JSON.stringify(user);
  } catch (error) {
    ctx.set.status = 500;
    return { message: "internal server error" };
  }
};

export const profile = async (ctx: Context) => {
  try {
    const { address } = ctx.body as IUser;

    const user = await User.findOne({
      address,
    }).select("-_id -__v -updatedAt");

    if (!user) {
      ctx.set.status = 404;
      return { message: "User not found" };
    }

    ctx.set.status = 200;
    return JSON.stringify(user);
  } catch (error) {
    ctx.set.status = 500;
    return { message: "internal server error" };
  }
};
