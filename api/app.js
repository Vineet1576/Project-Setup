require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Suppress noisy CryptoSecure middleware warnings (plaintext response notices)
const _originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
  if (message.includes('[CryptoSecure]') && message.includes('plaintext')) return;
  _originalWarn(...args);
};

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dbConfig = require('./src/config/db.config');

// Environment keys that can be overridden from the DB settings collection
const CONFIG_KEYS = [
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CRYPTO_SECURE_ENCRYPTION',
  'SECRET_KEY',
  'ENCRYPTION_IV',
  'RUN_SEED',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'CORS_ORIGIN',
];

// Database connection
const connectToDatabase = async () => {
  const dbUrl = dbConfig.url;
  if (!dbUrl || dbUrl.includes('undefined')) {
    console.log('MongoDB not connected — missing connection details in .env');
    return;
  }
  try {
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected');
  } catch {
    console.log('MongoDB not connected — invalid connection details');
  }
};

// Load environment overrides from the DB settings collection (overrides .env)
const applyDbConfig = async () => {
  try {
    const db = require('./src/models');
    const settings = await db.settings.findOne({ key: 'global' }).lean();
    const config = (settings && settings.config) || {};
    let applied = 0;
    for (const key of CONFIG_KEYS) {
      const value = config[key];
      if (typeof value === 'string' && value.trim() !== '') {
        process.env[key] = value.trim();
        applied += 1;
      }
    }
    console.log(`Environment config loaded from database (${applied} key(s) applied)`);
  } catch (err) {
    console.log('Environment config not loaded from DB — using .env:', err.message);
  }
};

const bootstrap = async () => {
  await connectToDatabase();
  await applyDbConfig();

  const express = require('express');
  const http = require('http');
  const { Server } = require('socket.io');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const morgan = require('morgan');
  const { protect: authMiddleware } = require('./src/middleware/auth');
  const routes = require('./src/routes');
  const { errorHandler, notFound } = require('./src/middleware/errorHandler');
  const decryptMiddleware = require('./src/middleware/decrypt');
  const seed = require('./seed');
  const { registerSocket } = require('./src/services/socket');

  const app = express();
  const PORT = process.env.PORT || 3000;
  const useCryptoSecure = process.env.CRYPTO_SECURE_ENCRYPTION === 'true';

  require('./src/models');

  // Seed default roles and admin user on startup (set RUN_SEED=true in .env to enable)
  if (process.env.RUN_SEED === 'true') seed();

  // Crypto-secure keypair setup (load keys from env vars; generate if missing)
  const setupCryptoSecure = () => {
    const cs = require('crypto-secure');

    let privateKey = process.env.CRYPTO_SECURE_PRIVATE_KEY;
    let publicKey = process.env.CRYPTO_SECURE_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
      console.log('Generating ECDH P-256 keypair...');
      const keypair = cs.generateECDHKeyPair();
      privateKey = keypair.privateKey;
      publicKey = keypair.publicKey;
      const envPath = __dirname + '/.env';
      const escapedPrivateKey = privateKey.replace(/\n/g, '\\n');
      const escapedPublicKey = publicKey.replace(/\n/g, '\\n');
      const keyLines =
        '\n# Crypto-secure ECDH keypair (auto-generated)\n' +
        `CRYPTO_SECURE_PRIVATE_KEY="${escapedPrivateKey}"\n` +
        `CRYPTO_SECURE_PUBLIC_KEY="${escapedPublicKey}"\n`;
      fs.appendFileSync(envPath, keyLines);
      console.log('ECDH P-256 keypair generated and saved to .env');
    }

    app.get('/.well-known/encryption-key', (req, res) => {
      res.json({ publicKey });
    });

    app.use(cs.middleware({ privateKey }));

    console.log('crypto-secure encryption enabled (ECDH P-256 + AES-256-GCM)');
  };

  // Global middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
        : false,
    }),
  );
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
  }
  app.use((req, res, next) => {
    if (req.path === '/subscriptions/webhook') return next();
    return express.json({ limit: '5mb' })(req, res, next);
  });
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use(express.static(path.join(__dirname, 'public')));

  if (useCryptoSecure) setupCryptoSecure();

  const isDev = process.env.NODE_ENV !== 'production';

  // Per-IP rate limit: 100 req/min for general endpoints (disabled in dev)
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 0 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    ...(isDev && { skip: () => true }),
  });

  // Per-IP rate limit: 15 req/min for auth endpoints to prevent brute-force (disabled in dev)
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 0 : 15,
    standardHeaders: true,
    legacyHeaders: false,
    ...(isDev && { skip: () => true }),
  });

  app.use(generalLimiter);
  app.use('/users/login', authLimiter);
  app.use('/users/register', authLimiter);
  app.use('/users/forgot-password', authLimiter);
  app.use('/users/reset-password', authLimiter);
  app.use('/users/verify-email', authLimiter);

  app.use((req, res, next) => {
    if (req.path === '/subscriptions/webhook') return next();
    return decryptMiddleware(req, res, next);
  });
  app.use(authMiddleware);
  app.use(routes);

  // Centralized error handling
  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
        : false,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  registerSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

bootstrap();
