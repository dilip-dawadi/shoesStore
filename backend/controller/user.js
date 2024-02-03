import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import verifyUser from "../models/valideUser.js";
import { CheckoutEmail, sendVerificationEmail } from "../Utils/nodemailer.js";
import Product from "../models/productModel.js";
import { APIfeatures } from "./paginate.js";
const generateToken = (data) => {
  const { _id, email, name, role, wishlist, number, address, cart } = data;
  return jwt.sign(
    { _id, email, name, role, wishlist, number, address, cart },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};
const generateSessionToken = (data, res) => {
  const { _id, role } = data;
  const token = jwt.sign({ _id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
};
export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      res.status(404).json({ message: "User doesn't exist." });
      return;
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      res.status(400).json({ message: "Invalid credentials." });
      return;
    }
    const token = generateToken(existingUser);
    if (!existingUser?.verifiedUser) {
      let checkVerify = await verifyUser.findOne({ userId: existingUser._id });
      if (!checkVerify) {
        checkVerify = await new verifyUser({
          userId: existingUser._id,
          token: token,
        }).save();
        const url = `${process.env.BASE_URL}user/${existingUser._id}/verify/${checkVerify.token}`;
        sendVerificationEmail(
          existingUser.email,
          "Verify Email from Shoes Store",
          url
        );
        res
          .status(355)
          .json({ message: "Please verify your email before 24 hours" });
        return;
      }
      res
        .status(355)
        .send({ message: "Already sent verification email, please verify" });
      return;
    }
    generateSessionToken(existingUser, res);
    // check if it is morning or evening
    const time = new Date().getHours();
    let greeting;
    if (time >= 5 && time < 12) {
      greeting = "Good Morning";
    } else if (time >= 12 && time < 17) {
      greeting = "Good Afternoon";
    } else if (time >= 17 && time < 20) {
      greeting = "Good Evening";
    } else {
      greeting = "Good Night";
    }
    existingUser.role === true
      ? res.status(200).json({
          token: token,
          message: `${greeting} & Welcome Admin, ${
            existingUser.name.split(" ")[0]
          }`,
        })
      : res.status(200).json({
          token: token,
          message: `${greeting} & Welcome Back, ${
            existingUser.name.split(" ")[0]
          }`,
        });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const signOut = async (req, res) => {
  const { userId } = req;
  try {
    if (!userId) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    const userName = await User.findById(userId).select("name");
    res.clearCookie("token");
    res
      .status(200)
      .json({ message: `Goodbye, ${userName?.name.split(" ")[0]}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const signup = async (req, res) => {
  const { email, password, firstName, number, lastName, role, address } =
    req.body;
  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists." });
      return;
    }
    if (
      firstName === "" ||
      lastName === "" ||
      email === "" ||
      password === ""
    ) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    } else if (password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    existingUser = await new User({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      number,
      role,
      address,
    }).save();
    const createVerify = await new verifyUser({
      userId: existingUser._id,
      token: generateToken(existingUser),
    }).save();
    const url = `${process.env.BASE_URL}user/${existingUser._id}/verify/${createVerify.token}`;
    const { status } = await sendVerificationEmail(
      existingUser.email,
      "Verify Email from Shoes Store",
      url
    );
    if (status < 400) {
      res.status(200).json({
        message: `Registered successfully. Please verify your email before 24 hours`,
      });
    } else {
      res.status(355).json({
        message: "Email verification failed. Contact our service provider.",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      message: error.message,
    });
  }
};
export const getVerified = async (req, res) => {
  const { userId, verifyId } = req.params;
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const Verified = await verifyUser.findOne({
      userId: user._id,
      token: verifyId,
    });
    if (!Verified) {
      res.status(404).json({ message: "Invalid verification link" });
      return;
    }
    await User.updateOne({ _id: user._id }, { verifiedUser: true });
    await Verified.remove();
    generateSessionToken(user, res);
    const token = generateToken(user);
    user?.role === true
      ? res.status(200).json({
          message: `Welcome Admin, ${user.name.split(" ")[0]}`,
          verifyMessage: "Email Verified",
          token: token,
        })
      : res.status(200).json({
          message: `Welcome, ${user.name.split(" ")[0]}`,
          verifyMessage: "Email Verified",
          token: token,
        });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
export const addWishlist = async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const checkWishlist = user.wishlist.find((item) => item === id);
    if (checkWishlist) {
      res
        .status(400)
        .json({ data: user.wishlist, message: "Product already in wishlist" });
      return;
    } else {
      user.wishlist.push(id);
      await user.save();
      const token = generateToken(user);
      res.status(200).json({
        token,
        data: user.wishlist,
        message: "Product added to wishlist",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const removeWishlist = async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const checkWishlist = user.wishlist.find((item) => item === id);
    if (!checkWishlist) {
      res
        .status(400)
        .json({ data: user.wishlist, message: "Product not in wishlist" });
      return;
    }
    user.wishlist = user.wishlist.filter((item) => item !== id);
    await user.save();
    const token = generateToken(user);
    res.status(200).json({
      token,
      data: user.wishlist,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getWishlist = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    req.query.page = String(parseInt(req.query.page));
    req.query.limit = String(parseInt(req.query.limit));
    const features = new APIfeatures(
      Product.find({ _id: { $in: user.wishlist } }),
      req.query
    )
      .sorting()
      .paginating()
      .filtering();
    const data = await features.query;
    const token = generateToken(user);
    res.status(200).json({ token, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const products = await Product.find({
      _id: { $in: user.cart.map((item) => item.cartId) },
    });
    const token = generateToken(user);
    res.status(200).json({ token, data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const addCart = async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const checkCart = user.cart.find((item) => item.cartId === id);
    if (checkCart) {
      res
        .status(400)
        .json({ data: user.cart, message: "Product already in cart" });
      return;
    } else {
      const product = await Product.findById(id);
      if (product?.quantity === 0) {
        res
          .status(400)
          .json({ data: user.cart, message: "Product out of stock" });
        return;
      } else {
        const cartId = id;
        const quantity = 1;
        user.cart.push({ cartId, quantity });
        await user.save();
        const token = generateToken(user);
        res
          .status(200)
          .json({ token, data: user.cart, message: "Product added to cart" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const removeCart = async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const checkCart = user.cart.find((item) => item.cartId === id);
    if (!checkCart) {
      res.status(400).json({ data: user.cart, message: "Product not in cart" });
      return;
    } else {
      user.cart = user.cart.filter((item) => item.cartId !== id);
      await user.save();
      const token = generateToken(user);
      res
        .status(200)
        .json({ token, data: user.cart, message: "Product removed from cart" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const cartQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    if (!user) {
      res.status(400).json({ message: "User does not exist." });
      return;
    }
    const product = await Product.findById(id);
    const quantity = user.cart.find((item) => item.cartId === id).quantity;
    if (status === "increase") {
      if (product !== null && product.quantity <= quantity) {
        res.status(400).json({ message: "Product out of stock" });
        return;
      }
    }
    const checkCart = user.cart.find((item) => item.cartId === id);
    if (!checkCart) {
      res.status(400).json({ data: user.cart, message: "Product not in cart" });
      return;
    } else {
      if (status === "increase") {
        user.cart = user.cart.map((item) => {
          console.log(item);
          if (item.cartId === id) {
            item.quantity = item.quantity + 1;
          }
          return item;
        });
      } else {
        user.cart = user.cart.map((item) => {
          if (item.cartId === id) {
            if (item.quantity === 1) {
              return item;
            } else {
              item.quantity = item.quantity - 1;
            }
          }
          return item;
        });
      }
      await User.findByIdAndUpdate(
        { _id: req.userId },
        {
          cart: user.cart,
        }
      );
      const token = generateToken(user);
      res
        .status(200)
        .json({ token, data: user.cart, message: "Cart quantity updated" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const checkout = async (req, res) => {
  try {
    const { total } = req.body;
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const products = await Product.find({
      _id: { $in: user.cart.map((item) => item.cartId) },
    });
    const cart = user.cart;
    CheckoutEmail("Order Summary", user, total, cart, products);
    const updateUser = await User.findByIdAndUpdate(
      { _id: req.userId },
      {
        cart: [],
      }
    );
    const token = generateToken(updateUser);
    res.status(200).json({
      token,
      message: "Checkout successful, check your email for details",
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
