// ======================
// MONGODB DATABASE CONNECTION MODULE - PRODUCTION READY
// ======================
const mongoose = require("mongoose");

// Configuration constants
const CONFIG = {
  MAX_RETRY_ATTEMPTS: 3, // Maximum number of retry attempts
  RETRY_DELAY_MS: 2000, // Initial retry delay in milliseconds
  RETRY_BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  HEALTH_CHECK_INTERVAL_MS: 30000, // Health check interval (30 seconds)
  CONNECTION_TIMEOUT_MS: 10000, // Connection timeout
  SERVER_SELECTION_TIMEOUT_MS: 5000, // Server selection timeout
  SOCKET_TIMEOUT_MS: 45000, // Socket timeout
  MAX_POOL_SIZE: 10, // Connection pool size
  MIN_POOL_SIZE: 2, // Minimum connection pool size
  MAX_IDLE_TIME_MS: 60000, // Max idle time before closing connection
};

// Connection state tracking
let connectionState = {
  isConnected: false,
  lastHealthCheck: null,
  connectionAttempts: 0,
  lastError: null,
  connectionMetrics: {
    totalConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    connectionStartTime: null,
  },
};

// Connection event listeners setup
const setupConnectionEventListeners = () => {
  mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
    connectionState.isConnected = true;
    connectionState.lastError = null;
    connectionState.connectionMetrics.totalConnections++;
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Mongoose connection error:", err.message);
    connectionState.isConnected = false;
    connectionState.lastError = err;
    connectionState.connectionMetrics.failedConnections++;
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ Mongoose disconnected from MongoDB");
    connectionState.isConnected = false;
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔁 Mongoose reconnected to MongoDB");
    connectionState.isConnected = true;
  });

  // Monitor connection pool
  mongoose.connection.on("open", () => {
    const pool = mongoose.connection.client?.s?.pool;
    if (pool) {
      console.log(`📊 Connection pool stats: 
        Total connections: ${pool.totalConnectionCount}
        Available connections: ${pool.availableConnectionCount}
        Pending connections: ${pool.pendingConnectionCount}
      `);
    }
  });
};

// 1. CONNECTION RETRY LOGIC WITH EXPONENTIAL BACKOFF
const connectWithRetry = async (uri, options, attempt = 1) => {
  const startTime = Date.now();

  try {
    console.log(
      `🔄 Connection attempt ${attempt}/${CONFIG.MAX_RETRY_ATTEMPTS}...`,
    );

    await mongoose.connect(uri, options);

    const connectionTime = Date.now() - startTime;
    connectionState.connectionMetrics.averageConnectionTime =
      (connectionState.connectionMetrics.averageConnectionTime *
        (connectionState.connectionMetrics.totalConnections - 1) +
        connectionTime) /
      connectionState.connectionMetrics.totalConnections;

    console.log(`✅ Connected successfully in ${connectionTime}ms`);
    return true;
  } catch (error) {
    console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

    if (attempt < CONFIG.MAX_RETRY_ATTEMPTS) {
      // Calculate exponential backoff delay
      const delay =
        CONFIG.RETRY_DELAY_MS *
        Math.pow(CONFIG.RETRY_BACKOFF_MULTIPLIER, attempt - 1);

      console.log(`⏳ Retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Recursive retry
      return await connectWithRetry(uri, options, attempt + 1);
    }

    throw error;
  }
};

// 2. DATABASE HEALTH CHECK
const performHealthCheck = async () => {
  try {
    const startTime = Date.now();

    // Simple health check - run a quick query
    await mongoose.connection.db.admin().ping();

    const responseTime = Date.now() - startTime;
    connectionState.lastHealthCheck = new Date();

    return {
      status: "healthy",
      responseTime,
      timestamp: connectionState.lastHealthCheck,
      connectionState: connectionState.isConnected
        ? "connected"
        : "disconnected",
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date(),
      connectionState: "disconnected",
    };
  }
};

// 3. CONNECTION POOLING METRICS MONITORING
const getConnectionMetrics = () => {
  const pool = mongoose.connection.client?.s?.pool;

  return {
    general: {
      isConnected: connectionState.isConnected,
      lastHealthCheck: connectionState.lastHealthCheck,
      connectionAttempts: connectionState.connectionAttempts,
      lastError: connectionState.lastError?.message || null,
    },
    performance: {
      totalConnections: connectionState.connectionMetrics.totalConnections,
      failedConnections: connectionState.connectionMetrics.failedConnections,
      averageConnectionTime:
        connectionState.connectionMetrics.averageConnectionTime,
      connectionUptime: connectionState.connectionStartTime
        ? Date.now() - connectionState.connectionStartTime
        : 0,
    },
    poolStats: pool
      ? {
          totalConnections: pool.totalConnectionCount,
          availableConnections: pool.availableConnectionCount,
          pendingConnections: pool.pendingConnectionCount,
          maxPoolSize: pool.options.maxPoolSize,
          minPoolSize: pool.options.minPoolSize,
        }
      : null,
  };
};

// 4. MULTI-HOST CONNECTION STRING SUPPORT
const parseAndValidateConnectionString = (uri) => {
  if (!uri) {
    throw new Error("❌ MONGO_URI is not defined in environment variables");
  }

  // Check if it's a MongoDB Atlas connection string
  const isAtlas = uri.includes("mongodb+srv://");

  // Check if multiple hosts are specified (for replica sets)
  const hasMultipleHosts = uri.match(/mongodb:\/\/[^/]+,/);

  return {
    uri,
    isAtlas,
    hasMultipleHosts,
    isReplicaSet: uri.includes("replicaSet="),
    // Extract hosts for logging (masked for security)
    maskedUri: uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"),
  };
};

// 5. GRACEFUL SHUTDOWN HANDLING
const setupGracefulShutdown = () => {
  const shutdownSignals = ["SIGINT", "SIGTERM", "SIGQUIT"];

  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      try {
        // Close MongoDB connection
        if (mongoose.connection.readyState === 1) {
          console.log("Closing MongoDB connection...");
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
        }

        console.log("Graceful shutdown completed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });
  });
};

// 6. DATABASE CONNECTION STATE MONITORING
const monitorConnectionState = () => {
  // Periodic health checks
  const healthCheckInterval = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      // 1 = connected
      const health = await performHealthCheck();

      if (health.status === "unhealthy") {
        console.warn("⚠️ Database health check failed:", health.error);
        // Could trigger reconnection logic here
      }
    }
  }, CONFIG.HEALTH_CHECK_INTERVAL_MS);

  // Return cleanup function
  return () => clearInterval(healthCheckInterval);
};

// 7. CONNECTION STRING ROTATION (SECURITY)
const getRotatedConnectionString = () => {
  // In production, you might:
  // 1. Fetch from secure secret manager (AWS Secrets Manager, HashiCorp Vault)
  // 2. Use environment-specific connection strings
  // 3. Rotate credentials based on schedule

  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK;

  // Simple rotation logic - could be enhanced with more sophisticated logic
  const useFallback = process.env.USE_FALLBACK_DB === "true";

  return useFallback && fallbackUri ? fallbackUri : primaryUri;
};

/**
 * Enhanced database connection with all production features
 */
const connectDB = async () => {
  try {
    console.log(
      "🚀 Initializing database connection with production features...",
    );

    // Setup connection state tracking
    connectionState.connectionStartTime = Date.now();

    // 7. Connection string rotation
    const connectionInfo = parseAndValidateConnectionString(
      getRotatedConnectionString(),
    );

    console.log(`📡 Connecting to: ${connectionInfo.maskedUri}`);
    console.log(
      `🔧 Connection type: ${connectionInfo.isAtlas ? "MongoDB Atlas" : "Standard MongoDB"}`,
    );
    console.log(
      `🔁 High Availability: ${connectionInfo.hasMultipleHosts ? "Yes (Multiple hosts)" : "Single host"}`,
    );

    // Connection options with enhanced settings
    const connectionOptions = {
      dbName: process.env.DBNAME,
      maxPoolSize: CONFIG.MAX_POOL_SIZE,
      minPoolSize: CONFIG.MIN_POOL_SIZE,
      serverSelectionTimeoutMS: CONFIG.SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: CONFIG.SOCKET_TIMEOUT_MS,
      connectTimeoutMS: CONFIG.CONNECTION_TIMEOUT_MS,
      maxIdleTimeMS: CONFIG.MAX_IDLE_TIME_MS,

      // Additional production options
      retryWrites: true,
      retryReads: true,
      w: "majority", // Write concern

      // TLS/SSL options for production
      // ssl: process.env.NODE_ENV === 'production',
      // tlsAllowInvalidCertificates: false,
      // tlsAllowInvalidHostnames: false,
    };

    // 1. Connect with retry logic
    await connectWithRetry(connectionInfo.uri, connectionOptions);

    // Setup event listeners
    setupConnectionEventListeners();

    // 2. Perform initial health check
    const initialHealth = await performHealthCheck();
    console.log(
      `🏥 Initial health check: ${initialHealth.status} (${initialHealth.responseTime}ms)`,
    );

    // 6. Start connection state monitoring
    const stopMonitoring = monitorConnectionState();

    // 5. Setup graceful shutdown
    setupGracefulShutdown();

    // Register cleanup on process exit
    process.on("exit", () => {
      stopMonitoring();
      console.log("Database monitoring stopped.");
    });

    // Log initial metrics
    console.log("📊 Initial connection metrics:");
    console.log(JSON.stringify(getConnectionMetrics().general, null, 2));
  } catch (error) {
    console.error(
      "❌ Failed to connect to MongoDB after all retries:",
      error.message,
    );

    // Log detailed error information
    console.error("Full error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
    });

    // In production, you might want to:
    // 1. Send alert to monitoring system
    // 2. Fall back to read-only mode if applicable
    // 3. Attempt connection to backup database

    console.error(
      "💀 Application cannot start without database connection. Exiting...",
    );
    process.exit(1);
  }
};

// Export additional utility functions
module.exports = {
  connectDB,
  performHealthCheck, // For external health check endpoints
  getConnectionMetrics, // For monitoring dashboards
  getConnectionState: () => ({ ...connectionState }), // Read-only state access
  disconnectDB: async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("Database connection closed by request.");
    }
  },
};
