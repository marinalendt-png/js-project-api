import cors from "cors" //tillåter req från andra webplatser
import express from "express"
import data from "./data.json" with { type: "json" };
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import "dotenv/config";


//MONGO_URL=mongodb://localhost:27017/happy-thoughts

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
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts"
mongoose.connect(mongoUrl);
mongoose.Promise = Promise

// varje tanke som sparas i databasen måste följa denna struktur. Skapar mallen för datan. 
const thoughtSchema = new Schema({
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

// skapar verktyget för att hantera datan. Thought = namnet på samlingen i databasen. thoughtSchema = mallen vi skapade ovan. 
const Thought = mongoose.model("thought", thoughtSchema)


// ENDPOINTS //
// Showing all the endpoints
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json([{
    message: "Welcome to the Happy thoughts API",
    endpoints: endpoints,
  }])
});

//Endpoint for all the thoughts
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find()
    res.json(thoughts)
  } catch (error) {
    res.status(500).json({ error: "Could not fetch thoughts" })
  }
})

//Endpoint for the thoughts id, to get one thought
app.get("/thoughts/:id", async (req, res) => {
  try {
    const thoughtsId = await Thought.findById(req.params.id)

    if (!thoughtsId) {
      return res.status(404).json({ error: `Thought with id ${id} does not exist` })
    }
    res.json(thoughtsId)

  } catch (error) {
    return res.status(500).json({ error: `Could not fetch thoughts` })
  }
})

//Endpoint for hearts amount, gets thoughts with x amount of hearts
app.get("/thoughts/hearts/:amount", async (req, res) => {
  try {
    const minHearts = Number(req.params.amount)

    //isNaN = is Not a Number. Om användare skulle ange något annat än ett nr, errormeddelandet upp. 
    if (isNaN(minHearts)) {
      return res
        .status(400)
        .json({ error: `The amount must be a number` })
    }

    const filteredThoughts = await Thought.find({ hearts: { $gte: minHearts } })

    if (filteredThoughts.length === 0) {
      return res.status(404).json({ error: `No thoughts found with ${amount} or more hearts` })
    }
    res.json(filteredThoughts); //returnera resultat

  } catch (error) {
    res.status(500).json({ error: `Could not fetch thoughts` })
  }
})

//Här sparas nya thoughts som användaren skapar. Här skapas nya thoughts. 
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})