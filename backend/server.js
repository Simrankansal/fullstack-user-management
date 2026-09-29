const express = require("express");

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());

// Test API
app.get("/api/health", (req, res) => {
    res.json({
    success: true,
    message: "Backend server is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});