import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import listEndpoints from "express-list-endpoints";
import { router as thoughtRouter } from "./routes/thoughtRoutes.js";
import { router as userRouter } from "./routes/userRoutes.js";

// ======= Config & setup =======
const port = process.env.PORT || 9090
const app = express()

app.use(cors())
app.use(express.json())

// Showing all the endpoints and documentation. 
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json([{
    message: "Welcome to the Happy thoughts API",
    endpoints: endpoints,
  }])
});

// Database connection
const mongoUrl = process.env.MONGO_URL
mongoose.connect(mongoUrl);

app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: "Server is unavailable" })
  }
})

// The connections to the different routes with endpoints
app.use(userRouter);
app.use(thoughtRouter);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
});

// Graceful shutdown for Nodemon
process.on('SIGTERM', () => {
  console.log('Server shutting down...')
  server.close(() => {
    mongoose.connection.close()
    process.exit(0)
  })
}); 