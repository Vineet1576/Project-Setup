require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const dbConfig = require('./src/config/db.config');
const { protect: authMiddleware } = require('./src/middleware/auth');
const routes = require('./src/routes');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const decryptMiddleware = require('./src/middleware/decrypt');
const seed = require('./seed');
const { registerSocket } = require('./src/services/socket');

const app = express();
const PORT = process.env.PORT || 3000;
const useCryptoSecure = process.env.CRYPTO_SECURE_ENCRYPTION === 'true';

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
connectToDatabase();

require('./src/models');

// Seed default roles and admin user on startup (set RUN_SEED=true in .env to enable)
if (process.env.RUN_SEED === 'true') seed();

// Crypto-secure keypair setup (load keys from env vars; generate if missing)
const setupCryptoSecure = () => {
  const cs = require('crypto-secure');

  let privateKey = process.env.CRYPTO_SECURE_PRIVATE_KEY;
  let publicKey = process.env.CRYPTO_SECURE_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    console.log('Generating RSA-2048 keypair...');
    const keypair = cs.generateKeyPair();
    privateKey = keypair.privateKey;
    publicKey = keypair.publicKey;
    const envPath = __dirname + '/.env';
    const escapedPrivateKey = privateKey.replace(/\n/g, '\\n');
    const escapedPublicKey = publicKey.replace(/\n/g, '\\n');
    const keyLines =
      '\n# Crypto-secure RSA keypair (auto-generated)\n' +
      `CRYPTO_SECURE_PRIVATE_KEY="${escapedPrivateKey}"\n` +
      `CRYPTO_SECURE_PUBLIC_KEY="${escapedPublicKey}"\n`;
    fs.appendFileSync(envPath, keyLines);
    console.log('RSA-2048 keypair generated and saved to .env');
  }

  app.use(cs.middleware({ privateKey }));

  app.get('/.well-known/encryption-key', (req, res) => {
    res.json({ publicKey });
  });

  console.log('crypto-secure encryption enabled (RSA-2048 + AES-256-GCM)');
};

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : false,
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

app.use(decryptMiddleware);
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
