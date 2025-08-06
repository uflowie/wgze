import { Hono } from 'hono';
import type { Bindings } from './types';

// Import route modules
import authRoutes, { authMiddleware } from './routes/auth';
import foodRoutes from './routes/dishes';
import mealRoutes from './routes/meals';
import homeRoutes from './routes/home';
import aiRoutes from './routes/ai';

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Mount route modules
app.route('/', homeRoutes);
app.route('/login', authRoutes);
app.route('/meals', mealRoutes);
app.route('/dishes', foodRoutes);
app.route('/ai-suggestions', aiRoutes);

export default app;
