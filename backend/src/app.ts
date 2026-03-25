import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import authRoutes from './modules/auth.routes.js';
import subjectsRoutes from './modules/subjects.routes.js';
import questionsRoutes from './modules/questions.routes.js';
import drillsRoutes from './modules/drills.routes.js';
import analyticsRoutes from './modules/analytics.routes.js';
import parserRoutes from './modules/parser.routes.js';
import studentsRoutes from './modules/students.routes.js';
import { errorHandler, notFound } from './middleware/error.js';
import announcementsRoutes from './modules/announcements.routes.js';
import adminRoutes from './modules/admin.routes.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '3mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/drills', drillsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);
