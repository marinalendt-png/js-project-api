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

// Schema
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

// Model
const Thought = mongoose.model("thought", thoughtSchema)

//Seeding of DB, resetting the database
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    const count = await Thought.countDocuments() //Räknar dokument 
    if (count > 0) {
      return //om det finns dokument redan, gör inget
    }
    //om vi kommer hit, databasen är tom - seeda!
    await Thought.deleteMany()
    data.forEach(thought => {
      new Thought(thought).save()
    })
  }

  seedDatabase()
}

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
      return res.status(404).json({ error: `Thought with id ${id} does not exist` })
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
      return res.status(404).json({ error: `No thoughts found with ${amount} or more hearts` })
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

//PATCH-Method, updates a thought when liked. 
app.patch("/thoughts/:id", async (req, res) => {
  try {
    const id = req.params.id
    const { hearts } = req.body
    if (isNaN(hearts)) {
      return res.status(400).json({ error: "Hearts must be a number" })
    }
    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      { hearts: hearts },
      { new: true }
    )

    if (!updatedThought) {
      return res.status(404).json({ error: "Thought not found" })
    }
    res.json(updatedThought)

  } catch (error) {
    res.json(500).json({ error: "Could not update thought" })
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})