import bcrypt from "bcrypt";
import User from "../models/User.js";

const generatePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashPassword = await generatePassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
      role,
    });
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    if (email) {
      const emailInUse = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (emailInUse) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Solo un admin puede cambiar roles; si cambia la contraseña se revoca el refreshTokenId
    const updates = { name, email, phone };
    if (req.user.role === "admin") {
      updates.role = role;
    }
    if (password) {
      updates.password = await generatePassword(password);
      updates.refreshTokenId = null;
    }
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key],
    );

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokenId");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
