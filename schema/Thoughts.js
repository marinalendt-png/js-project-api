import { Schema, model } from "mongoose";

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

export const Thought = model("thought", thoughtSchema);