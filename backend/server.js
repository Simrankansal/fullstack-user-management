const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working",
  });
});

// Users API
app.get("/api/users", (req, res) => {
  const users = [
    {
      id: 1,
      name: "Simran",
      email: "simran@example.com",
    },
    {
      id: 2,
      name: "Rahul",
      email: "rahul@example.com",
    },
  ];

  res.json({
    success: true,
    users,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});