import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { pool } from './config/db.js';
import { initSocket } from './sockets/socketHandler.js';
import { errorHandler } from './middleware/error.js';
import { apiRouter } from './routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Allow dynamic cloud/local origins for seamless local and AWS EC2 deployments
      callback(null, true);
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

initSocket(io);

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1 AS healthy;');
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: dbCheck.rows.length > 0 ? 'CONNECTED' : 'DISCONNECTED'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      databaseError: error.message
    });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 VoltGrid DBMS API Server running on http://localhost:${PORT} (PostgreSQL @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'})`);
});
