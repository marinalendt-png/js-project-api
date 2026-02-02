import cors from "cors";
import express from "express";
import data from "./data.json" with { type: "json" };
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt"

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 9090
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// Error if the database is not responding. Also a middleware. 
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: `Server unavailable` })
  }
})

// Using MongoDB, connecting with database. 
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/auth"
mongoose.connect(mongoUrl);
mongoose.Promise = Promise

// Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
});

const thoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  }
})

// Models
const User = mongoose.model("User", userSchema);
const Thought = mongoose.model("thought", thoughtSchema);

// Middelware-function that looks up the user
const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({
    accessToken: req.header("Authorization")
  });
  if (user) {
    req.user = user
    next();
  } else {
    res.status(401).json({
      loggedOut: true
    });
  }
};

//GET-method. Showing all the endpoints and documentation. 
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json([{
    message: "Welcome to the Happy thoughts API",
    endpoints: endpoints,
  }])
});

//GET-method. Endpoint for all the thoughts. 
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find()
    res.json(thoughts)
  } catch (error) {
    res.status(500).json({ error: "Could not fetch thoughts" })
  }
})

//GET-method. Endpoint for the thoughts id, to get one specific thought. 
app.get("/thoughts/:id", async (req, res) => {
  try {
    const thoughtsId = await Thought.findById(req.params.id)

    if (!thoughtsId) {
      return res.status(404).json({ error: `Thought with id ${thoughtsId} does not exist` })
    }
    res.json(thoughtsId)

  } catch (error) {
    return res.status(500).json({ error: `Could not fetch thoughts` })
  }
})

//GET-method. Endpoint for hearts amount, gets thoughts with x amount of hearts
app.get("/thoughts/hearts/:amount", async (req, res) => {
  try {
    const minHearts = Number(req.params.amount)

    //isNaN = is Not a Number
    if (isNaN(minHearts)) {
      return res
        .status(400)
        .json({ error: `The amount must be a number` })
    }

    const filteredThoughts = await Thought.find({ hearts: { $gte: minHearts } })

    if (filteredThoughts.length === 0) {
      return res.status(404).json({ error: `No thoughts found with ${minHearts} or more hearts` })
    }
    res.json(filteredThoughts);

  } catch (error) {
    res.status(500).json({ error: `Could not fetch thoughts` })
  }
})

//POST-method. Adding a new message to the database
app.post("/thoughts", async (req, res) => {
  try {
    const { message } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: `Message is required` })
    }

    const newThought = await Thought.create({ message })

    res.status(201).json(newThought)
  } catch (error) {
    res.status(500).json({ error: `Could not create thought` })
  }
})

//POST-Method, creates a new user. Registration endpoint. 
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const salt = bcrypt.genSaltSync()
    const user = new User({ name, email, password: bcrypt.hashSync(password, salt) });
    await user.save();
    res.status(201).json({
      success: true,
      message: "User created",
      id: user._id,
      accessToken: user.accessToken
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Could not create user",
      errors: error
    });
  }
});

app.post("/sessions", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email
  })
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    res.json({ userId: user._id })
  } else {
    res.json({ notFound: true })
  }
})

//PATCH-Method, updates a thought when liked. 
app.patch("/thoughts/:id", async (req, res) => {
  try {
    const id = req.params.id
    const { message, hearts } = req.body

    const update = {}

    if (message !== undefined) {
      if (message.trim().length === 0) {
        return res.status(400).json({ error: "Message can not be empty" })
      }
      update.message = message
    }

    if (hearts !== undefined) {
      if (isNaN(hearts)) {
        return res.status(400).json({ error: "Hearts must be a number" })
      }
      update.hearts = hearts
    }

    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      update,
      { new: true }
    )

    if (!updatedThought) {
      return res.status(404).json({ error: "Thought not found" })
    }

    res.json(updatedThought)
  } catch (error) {
    res.status(500).json({ error: "Could not update thought" })
  }
})

//DELETE-method, deletes a thought
app.delete("/thoughts/:id", async (req, res) => {
  try {
    const id = req.params.id
    const deletedThought = await Thought.findByIdAndDelete(id)

    if (!deletedThought) {
      return res.status(404).json({ error: `Thought with id ${id} does not exist` })
    }
    res.json(deletedThought)
  } catch (error) {
    res.status(500).json({ error: "Could not delete thought " })
  }
})

// GET-method, secret endpoint. 
app.get("/secrets", authenticateUser);
app.get("/secrets", (req, res) => {
  res.json({ secret: "This is a super secret message." })
})

// Log-in endpoint. Finds user. 
app.post("/sessions", async () => {
  const user = await User.findOne({ email: req.body.email });
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    res.json({ userId: user._id, accessToken: user.accessToken });
  } else {
    res.json({ notFound: true });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

// Graceful shutdown for Nodemon
process.on('SIGTERM', () => {
  console.log('Server shutting down...')
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
})