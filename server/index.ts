import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'NexusChat Quantum Core',
    protocol: 'AES-256 E2EE',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[NexusChat Core] Server running on http://localhost:${PORT}`);
});

export default app;
