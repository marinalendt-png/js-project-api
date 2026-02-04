import express from "express";
import { Thought } from "../schema/Thoughts.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

export const router = express.Router();

// Endpoint for all the thoughts. 
router.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find()
    res.json(thoughts);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch thoughts" })
  }
});

// Endpoint for the thoughts id, to get one specific thought. 
router.get("/thoughts/:id", async (req, res) => {
  try {
    const thoughtsId = await Thought.findById(req.params.id)

    if (!thoughtsId) {
      return res.status(404).json({ error: `Thought with id ${req.params.id} does not exist` })
    }
    res.json(thoughtsId)

  } catch (error) {
    return res.status(500).json({ error: `Could not fetch thoughts` })
  }
});

// Adding a new message to the database
router.post("/thoughts", authenticateUser, async (req, res) => {
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
});

// Endpoint for liking a thought, increases hearts by 1
router.post("/thoughts/:id/like", async (req, res) => {
  try {
    const id = req.params.id;
    const thought = await Thought.findById(id);

    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    thought.hearts += 1;
    await thought.save();
    res.json(thought);

  } catch (error) {
    res.status(500).json({ error: "Could not like thought" });
  }
});


// Updates a thought - can update message and/or hearts
router.patch("/thoughts/:id", authenticateUser, async (req, res) => {
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
});

// Deletes a thought
router.delete("/thoughts/:id", authenticateUser, async (req, res) => {
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
});