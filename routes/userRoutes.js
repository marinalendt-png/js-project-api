import express from "express";
import bcrypt from "bcrypt";
import { User } from "../schema/User.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

export const router = express.Router();

// Creates a new user. Sign-up 
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const salt = bcrypt.genSaltSync(10) // 10 making it harder to hack the password. 
    const hashedPassword = bcrypt.hashSync(password, salt)
    const user = new User({ email, password: hashedPassword });

    await user.save();
    res.status(201).json({
      success: true,
      message: "User created",
      response: {
        email: user.email,
        id: user._id,
        accessToken: user.accessToken,
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not create user",
      response: error,
    });
  }
});

// Log-in endpoint. Finds user that has created an account. 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }
    res.json({
      success: true,
      message: "Login successful",
      response: {
        email: user.email,
        id: user._id,
        accessToken: user.accessToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// ======= Protected Routes - not in use =======
router.get("/secrets", authenticateUser, (req, res) => {
  res.json({ secret: "This is a super secret message." })
});
