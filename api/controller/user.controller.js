import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";

export const test = (req, res) => {
  res.json({ message: "Api is working" });
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.userid) {
    return next(errorHandler(403, "You are not allowed to update this user."));
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return next(
        errorHandler(400, "Password cann't be less than 6 characters")
      );
    }
    req.body.password = bcryptjs.hashSync(req.body.password, 10);
  }

  if (req.body.username) {
    if (req.body.username.length < 7 || req.body.username.length > 20) {
      return next(
        errorHandler(400, "Username must be between 7 and 20 characters")
      );
    }
    if (req.body.username.includes(" ")) {
      return next(errorHandler(400, "Username cann't contain spaces"));
    }
    if (req.body.username !== req.body.username.toLowerCase()) {
      return next(errorHandler(400, "Username must be lowercase"));
    }
    if (!req.body.username.match(/^[a-z0-9]+$/)) {
      return next(
        errorHandler(400, "Username can only contain letters and numbers")
      );
    }
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userid,
      {
        $set: {
          username: req.body.username,
          password: req.body.password,
          profilePicture: req.body.profilePicture,
          email: req.body.email,
        },
      },
      {
        new: true,
      }
    );

    const { password, ...rest } = updatedUser._doc;

    const successRes = { ...rest, success: true };

    res.status(200).json(successRes);
  } catch (error) {
    next(errorHandler(500, "Username already exists"));
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user._id !== req.params.userId) {
    return next(errorHandler(403, "You are not allowed to delete this user"));
  }
  try {
    await User.findByIdAndDelete(req.params.userid);
    res.status(200).json("User has been deleted");
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res, next) => {
  try {
    res
      .clearCookie("access_token")
      .status(200)
      .json("User has been signed out");
  } catch (error) {
    next(error);
  }
};
