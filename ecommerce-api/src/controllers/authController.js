import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
const generateToken = (userId, name, role) => {
  return jwt.sign({ userId, name, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const generatePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const checkUserExist = async (email) => {
  const user = await User.findOne({ email });
  return user;
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const userExist = await checkUserExist(email);

    if (userExist) {
      return res
        .status(400)
        .json({ message: "No se pudo completar el registro" });
    }

    const hashPassword = await generatePassword(password);
    const role = "customer";

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      role,
      phone,
    });

    await newUser.save();
    await Cart.create({ user: newUser._id, products: [] });
    res.status(201).json({ name, email, phone });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userExist = await checkUserExist(email);

    if (!userExist) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, userExist.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = generateToken(userExist._id, userExist.name, userExist.role);
    const refreshToken = generateRefreshToken(userExist._id);

    res.status(200).json({ token, refreshToken });
  } catch (error) {
    next(error);
  }
};

//Funcion nueva para generar un nuevo token con el refresh 
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "No se mando Refresh token"});
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({message : "Usuario no encontrado"})
    }
    
    const token = generateToken(user._id, user.name, user.role);
    res.status(200).json({ token });
  } catch (error) {
    return res.status(401).json({message: "Refresh Token Invalido"});
  }
}

export { register, login, refresh };
