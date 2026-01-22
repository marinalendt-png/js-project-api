import cors from "cors"
import express from "express"
import data from "./data.json" with { type: "json" };
import listEndpoints from "express-list-endpoints";


// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 9090
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// Start defining your routes here. Endpoint! Response-object
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json([{
    message: "Welcome to the Happy thoughts API",
    endpoints: endpoints,
  }])
});

//Endpoint for all the thoughts
app.get("/thoughts", (req, res) => {
  res.json(data)
})

//Endpoint for the thoughts id 
app.get("/thoughts/:id", (req, res) => {
  const id = req.params.id
  const thoughtsId = data.find((thought) => (thought._id) === (id));

  if (!thoughtsId) {
    return res
      .status(404)
      .json({ error: `Thought with id ${id} does not exist` })
  }

  res.json(thoughtsId)
})

//Endpoint for hearts/likes



// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
