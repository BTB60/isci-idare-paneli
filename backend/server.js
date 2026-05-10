/**
 * 555 Insaat - Worker Management System Backend
 * Main Server File
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
// Hər zaman backend/.env — repo kökündən `node backend/server.js` işlədəndə də düzgün yüklənir
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createLogger } = require('./utils/logger');
const { validateEnv } = require('./utils/validateEnv');
const { errorHandler } = require('./middleware/errorHandler');
const { setupCronJobs } = require('./utils/cronJobs');
const { initializeSocket } = require('./utils/socket');

const logger = createLogger();

function parseAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    return ['https://555insaat.az', 'https://www.555insaat.az'];
  }
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
}

const allowedOrigins = parseAllowedOrigins();
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Express app
const app = express();

if (isProduction) {
  app.set('trust proxy', 1);
}
const server = require('http').createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS — prod: whitelist; dev: icazə ver Live Server və müxtəlif localhost portlarına
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (isProduction) {
      return callback(null, allowedOrigins.includes(origin));
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// MongoDB olmadan digər API marşrutları işləməsin; aydın JSON cavab (brauzerdə "Failed to fetch" əvəzinə)
app.use((req, res, next) => {
  const path = req.path || '';
  if (!path.startsWith('/api')) return next();
  if (path === '/api/health') return next();
  if (path === '/api' && req.method === 'GET') return next();
  // Giriş formu üçün rol siyahısı Mongo olmadan da işləsin (statik fallback marşrutda)
  if (req.method === 'GET' && path === '/api/roles/login-options') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'MongoDB əlaqəsi yoxdur. MongoDB işə salın və ya backend/.env faylında MONGODB_URI (məs. Atlas) yazıb serveri yenidən işə salın.'
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/shift-changes', require('./routes/shiftChanges'));
app.use('/api/penalties', require('./routes/penalties'));
app.use('/api/bonuses', require('./routes/bonuses'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/overtime', require('./routes/overtime'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/qr', require('./routes/qr'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: 'Server is running',
    mongoConnected,
    mongoInMemory: Boolean(global.__mongoMemoryServer),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: '555 Insaat API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      workers: '/api/workers',
      attendance: '/api/attendance',
      salary: '/api/salary',
      tasks: '/api/tasks',
      projects: '/api/projects',
      permissions: '/api/permissions',
      reports: '/api/reports',
      notifications: '/api/notifications',
      documents: '/api/documents',
      trainings: '/api/trainings'
    }
  });
});

// Frontend — repo kökündəki HTML/CSS/JS (deploy-da tək servis: https://host/login.html və /api eyni origin)
const frontendRoot = path.join(__dirname, '..');
app.use(
  express.static(frontendRoot, {
    index: ['index.html'],
    extensions: ['html'],
    maxAge: isProduction ? '1h' : 0,
    dotfiles: 'ignore'
  })
);

// 404 — API üçün JSON, digər sorğular üçün sadə mətn
app.use((req, res) => {
  if ((req.path || '').startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  res.status(404).type('text/plain').send('Tapılmadı — düzgün .html faylına daxil olun (məs. /login.html).');
});

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    validateEnv(logger);

    const { connectMongo } = require('./utils/dbConnect');
    await connectMongo(logger);
    setupCronJobs();

    const { seedBuiltInRoles, migrateUsersRoleLanding } = require('./scripts/seedBuiltInRoles');
    await seedBuiltInRoles(logger);
    await migrateUsersRoleLanding(logger);

    const bindHost = process.env.HOST || '0.0.0.0';
    server.listen(PORT, bindHost, () => {
      logger.info(
        `Server running on http://${bindHost}:${PORT} (${process.env.NODE_ENV || 'development'})`
      );
    });
  } catch (err) {
    console.error(err);
    logger.error(`Server başlamadı: ${err.stack || err.message || err}`);
    process.exit(1);
  }
}

bootstrap();

module.exports = { app, server, io };
