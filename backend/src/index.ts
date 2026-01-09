import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// load .env file
dotenv.config();

// create express app
const app = express();
const PORT = process.env.PORT || 3000;

// middleware : run on every request
app.use(cors()); // alow to create cross origin requests
app.use(express.json()); // like @RequestBody in spring (parse json bodies)

// health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
