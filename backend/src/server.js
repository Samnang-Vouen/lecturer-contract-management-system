import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sequelize from './config/db.js';
import { registerRoutes } from './route/index.js';
// Import models to ensure they are loaded with associations
import './model/index.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { CORS_ALLOWED_ORIGIN } from './config/constants.js';
import { runSchemaBootstrapping } from './bootstrap/schema.js';
import { runSeeds } from './bootstrap/seeds.js';
import { initSocket } from './bootstrap/socket.js';

// Load env without noisy debug to avoid EPIPE when stdout is closed by parent
dotenv.config();
process.env.DOTENV_CONFIG_SILENT = 'true';



const app = express();

const server = http.createServer(app);
init(server);

const PORT = process.env.PORT || 4000;
const ORIGIN = CORS_ALLOWED_ORIGIN;

app.use(express.json());
app.use(cookieParser());
// Allow flexible localhost origins in development (Vite may pick a random port)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps / curl / local HTML files
    // Allow exact configured origin
    if (origin === ORIGIN) return callback(null, true);
    // Allow any localhost:* during development
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/i.test(origin)) {
      return callback(null, true);
    }
    // Allow file:// protocol (local HTML files) in development
    if (process.env.NODE_ENV !== 'production' && origin === 'null') {
      return callback(null, true);
    }
    // Prevent Node from crashing on EPIPE when parent process closes stdout/stderr pipes
    try {
      process.stdout.on('error', (err) => {
        if (err && err.code === 'EPIPE') return;
      });
      process.stderr.on('error', (err) => {
        if (err && err.code === 'EPIPE') return;
      });
    } catch {}

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

registerRoutes(app);
// Serve uploaded lecturer files (CVs, syllabi)
app.use('/uploads', express.static('uploads'));
// Serve test HTML file for evaluation upload
app.get('/test-upload', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'test-upload.html'));
});
// Swagger/OpenAPI docs
const openapiPath = path.join(process.cwd(), 'src', 'openapi.json');
let openapiDoc = null;
try {
  openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
} catch (e) {
  console.error('Failed to load openapi.json', e.message);
  openapiDoc = { openapi: '3.0.0', info: { title: 'API Docs', version: '0.0.0' } };
}
app.get('/api/openapi.json', (_req, res) => res.json(openapiDoc));
app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(openapiDoc));
// Liveness/health check endpoint used by uptime monitors or container orchestrators
// to quickly verify the API process is running (does not perform deep dependency checks).
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// Readiness: performs a lightweight DB auth check
app.get('/api/ready', async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ status: 'ready' });
  } catch (e) {
    return res.status(503).json({ status: 'degraded', error: e.message });
  }
});

// 404 and error handlers for graceful failures
app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    // Use alter:true only if DB_ALTER_SYNC === 'true'
    const shouldAlterSync = process.env.DB_ALTER_SYNC === 'true';
    if (shouldAlterSync) {
      await sequelize.sync({ alter: true });
      console.log('[startup] Database synchronized (alter mode)');
    } else {
      await sequelize.sync();
      console.log('[startup] Database synchronized (safe mode)');
    }
    // Optional bootstrapping: control via env flags
    const MIGRATE_ON_START = process.env.MIGRATE_ON_START !== 'false'; // default true in dev
    const SEED_ON_START = process.env.SEED_ON_START !== 'false'; // default true in dev
    if (MIGRATE_ON_START) await runSchemaBootstrapping(sequelize);
    if (SEED_ON_START) await runSeeds();

    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (e) {
    console.error('Startup failure:', e.message);
    process.exit(1);
  }
})(); // Trigger restart
