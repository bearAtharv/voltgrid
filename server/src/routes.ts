import { Router } from 'express';
import { authenticateToken, requireRole } from './middleware/auth.js';
import { authLimiter, sqlLimiter } from './middleware/rateLimiter.js';
import { login, quickLogin, registerDriver, getMe } from './controllers/authController.js';
import { getStations, getStationById, getTariffPlans } from './controllers/stationController.js';
import { bookReservation, getMyReservations, cancelReservation, completeSession } from './controllers/reservationController.js';
import { getTickets, createTicket, claimTicket, resolveTicket } from './controllers/ticketController.js';
import { getLeaderboard, getGridHierarchy, getStationPerformance, getUtilizationTrends, refreshMaterializedView } from './controllers/analyticsController.js';
import { getSqlHistory, executeSqlConsole } from './controllers/sqlController.js';

export const apiRouter = Router();

// 1. Auth & Persona Authentication (Brute-force limited)
apiRouter.post('/auth/login', authLimiter, login);
apiRouter.post('/auth/quick-login', authLimiter, quickLogin);
apiRouter.post('/auth/register', authLimiter, registerDriver);
apiRouter.get('/auth/me', authenticateToken, getMe);

// 2. Charging Stations & Tariff Plans (In-memory TTL cached)
apiRouter.get('/stations', getStations);
apiRouter.get('/stations/tariffs', getTariffPlans);
apiRouter.get('/stations/:id', getStationById);

// 3. Charging Reservations (ACID atomic locking + GIST exclusion)
apiRouter.post('/reservations/book', authenticateToken, requireRole('DRIVER', 'ADMIN'), bookReservation);
apiRouter.get('/reservations/my-reservations', authenticateToken, requireRole('DRIVER', 'ADMIN'), getMyReservations);
apiRouter.delete('/reservations/:id', authenticateToken, requireRole('DRIVER', 'ADMIN'), cancelReservation);
apiRouter.post('/reservations/:id/complete', authenticateToken, requireRole('DRIVER', 'TECHNICIAN', 'ADMIN'), completeSession);

// 4. Hardware Maintenance & Incidents (Automated trigger synchronization)
apiRouter.get('/tickets', authenticateToken, getTickets);
apiRouter.post('/tickets', authenticateToken, createTicket);
apiRouter.patch('/tickets/:id/claim', authenticateToken, requireRole('TECHNICIAN', 'ADMIN'), claimTicket);
apiRouter.patch('/tickets/:id/resolve', authenticateToken, requireRole('TECHNICIAN', 'ADMIN'), resolveTicket);

// 5. OLAP Analytics (Recursive tree, window functions, materialized views)
apiRouter.get('/analytics/leaderboard', getLeaderboard);
apiRouter.get('/analytics/grid-hierarchy', getGridHierarchy);
apiRouter.get('/analytics/station-performance', getStationPerformance);
apiRouter.get('/analytics/utilization-trends', getUtilizationTrends);
apiRouter.post('/analytics/refresh-view', authenticateToken, requireRole('ADMIN'), refreshMaterializedView);

// 6. Interactive SQL Console & Live Inspector (Read-only PostgreSQL sandbox_readonly pool)
apiRouter.get('/sql/history', authenticateToken, getSqlHistory);
apiRouter.post('/sql/execute', authenticateToken, sqlLimiter, executeSqlConsole);

