// databaseHealth.js - Health check endpoint and monitoring
const {
  performHealthCheck,
  getConnectionMetrics,
} = require("../src/config/connectDb");

// Health check endpoint for load balancers
const healthCheck = async (req, res) => {
  const health = await performHealthCheck();

  if (health.status === "healthy") {
    res.status(200).json({
      status: "ok",
      database: health,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: "error",
      database: health,
      timestamp: new Date().toISOString(),
    });
  }
};

// Metrics endpoint for monitoring
const metrics = (req, res) => {
  const metrics = getConnectionMetrics();

  res.status(200).json({
    status: "ok",
    metrics,
    timestamp: new Date().toISOString(),
  });
};

// Database status endpoint
const status = (req, res) => {
  const { getConnectionState } = require("./src/config/connectDb");
  const state = getConnectionState();

  res.status(200).json({
    status: "ok",
    database: {
      connected: state.isConnected,
      lastHealthCheck: state.lastHealthCheck,
      uptime: state.connectionStartTime
        ? Math.floor((Date.now() - state.connectionStartTime) / 1000)
        : 0,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
  metrics,
  status,
};
