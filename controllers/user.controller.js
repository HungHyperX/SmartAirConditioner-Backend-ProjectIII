const User = require("../models/user.model.js");
// const bcrypt = require("bcrypt");
require("dotenv").config();
const userService = require("../services/user.service");
const authUtil = require("../utils/auth.util");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

const signUp = async (req, res) => {
  let { email, password, ...otherFields } = req.body;
  // Kiểm tra password
  if (!password) {
    return res.json({
      status: "FAILED",
      message: "Password is required!",
    });
  }

  try {
    const newUser = await userService.createUser({
      email,
      password,
      ...otherFields, // Spread other fields if there are additional fields
    });
    return res.json({
      status: "SUCCESS",
      message: "Signup successful!",
      data: newUser,
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "FAILED",
      message: "An error occurred during sign up!",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { ...otherFields } = req.body; // Adjust as needed to accept relevant fields

    // console.log(req.username)
    // console.log(otherFields);
    if (!otherFields || Object.keys(otherFields).length === 0) {
      return res.status(400).send("No fields to update.");
    }

    // Update the user information in the database
    const updatedUser = await userService.updateUser(req.user.username, {
      ...otherFields, // Spread other fields if there are additional updates
    });

    if (!updatedUser) {
      return res.status(404).send("User not found!");
    }
    res.json({
      status: "SUCCESS",
      message: "User updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred while updating the user!");
  }
};

const login = async (req, res) => {
  let { email, password } = req.body;
  // console.log(email);
  try {
    const user = await userService.getUserByEmail(email);
    // console.log(user);

    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).send("Password incorrect!");
    }

    const dataForAccessToken = {
      username: user.username,
      role: user.role,
      // Thêm các thông tin khác nếu cần
    };

    const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    const accessToken = await authUtil.generateToken(
      dataForAccessToken,
      accessTokenSecret,
      accessTokenLife
    );
    if (!accessToken) {
      return res.status(401).send("Login not successful!");
    }

    // **Tạo refresh token**
    const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    let refreshToken = await authUtil.generateToken(
      dataForAccessToken,
      refreshTokenSecret,
      refreshTokenLife
    );

    if (!user.refresh_token) {
      await userService.updateRefreshToken(user.username, refreshToken);
    } else {
      refreshToken = user.refresh_token;
    }

    if (!refreshToken) {
      return res.status(401).send("Login not successful!");
    }

    res.json({
      status: "SUCCESS",
      message: "Login successful!",
      username: `${user.username}`,
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred during login!");
  }
};

const logout = async (req, res) => {
  // Get the refresh token from the authorization header
  // const accessToken = req.headers["authorization"]?.split(" ")[1];

  // // Check if the refresh token is provided
  // if (!accessToken) {
  //   return res.status(403).send("Access token is required for logout!");
  // }

  try {
    // Decode the refresh token to get the username
    // const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    // const decoded = await authUtil.verifyToken(accessToken, accessTokenSecret);
    // Invalidate the refresh token by clearing it in the database
    await userService.updateRefreshToken(req.user.username, null);

    res.json({
      status: "SUCCESS",
      message: "Logout successful!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred during logout!");
  }
};

const refreshToken = async (req, res) => {
  // Lấy refresh token từ header
  // const refreshToken = req.headers["authorization"];
  const refreshToken = req.headers["authorization"]?.split(" ")[1];

  // Kiểm tra nếu không có refresh token trong header
  if (!refreshToken) {
    return res.status(403).send("Refresh token is required!");
  }

  try {
    // Lấy secret của refresh token từ biến môi trường
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    // Xác minh refresh token
    const decoded = await authUtil.verifyToken(
      refreshToken,
      refreshTokenSecret
    );

    // Tạo data cho access token mới
    const dataForAccessToken = {
      username: decoded.payload.username,
      role: decoded.payload.role,
    };
    // Thiết lập thời gian sống và secret cho access token
    const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    // Sinh access token mới
    const newAccessToken = await authUtil.generateToken(
      dataForAccessToken,
      accessTokenSecret,
      accessTokenLife
    );

    // Gửi lại access token mới cho client
    res.json({
      status: "SUCCESS",
      accessToken: `Bearer ${newAccessToken}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(403).send("Invalid refresh token!");
  }
};

const deleteUser = async (req, res) => {
  let { password } = req.body;
  try {
    // Verify the access token to ensure the user is authenticated
    const user = await userService.getUserByUserName(req.user.username);

    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).send("Password incorrect!");
    }
    await userService.deleteUser(user.username);

    res.json({
      status: "SUCCESS",
      message: "User deleted successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred while deleting the user!");
  }
};

const adminDeleteUser = async (req, res) => {
  const { id } = req.params; // Lấy ID từ request params
  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    // Tìm và xóa user trong database
    const user = await User.findOne({ where: { id: id } });
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await userService.deleteUser(user.username)
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  getAllUsers,
  signUp,
  login,
  refreshToken,
  logout,
  updateUser,
  deleteUser,
  adminDeleteUser,
};
