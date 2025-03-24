const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { errorHandler } = require('./middlewares/error.middleware');
const { logRequest } = require('./middlewares/logging.middleware');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const tenantRoutes = require('./routes/tenant.route');
const roleRoutes = require('./routes/role.route');
const permissionRoutes = require('./routes/permission.route');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.window * 60 * 1000,
  max: config.rateLimit.maxRequests
});
app.use(limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: config.session.maxAge
  }
}));

// Logging
app.use(morgan('combined'));
app.use(logRequest);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// Error handling
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    
    // Setup session cleanup job
    setInterval(async () => {
      try {
        await SessionService.cleanupExpiredSessions();
        console.log('Successfully cleaned up expired sessions');
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }
    }, 3600000); // Run hourly

    // Start server
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      }
      throw error;
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

module.exports = app;