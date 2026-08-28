/**
 * Retail OS — Backend Entry Point
 * Architecture: Domain-Driven Design (DDD), structured for AWS Lambda deployment.
 * Port: 4000
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Domain Routers
import posRouter from './domains/pos/pos.routes';
import crmRouter from './domains/crm/crm.routes';
import hrRouter from './domains/hr/hr.routes';
import inventoryRouter from './domains/inventory/inventory.routes';
import financeRouter from './domains/finance/finance.routes';
import { suppliersRouter } from './domains/suppliers/suppliers.routes';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'Retail OS Backend',
        timestamp: new Date().toISOString(),
    });
});

// ─── Domain Route Registration ────────────────────────────────────────────────
// Pattern: /api/<domain>/<action>
app.use('/api/pos', posRouter);

// TODO (Phase 2): Register additional domain routers as they are built.
app.use('/api/inventory', inventoryRouter);
app.use('/api/hr', hrRouter);
app.use('/api/crm', crmRouter);
app.use('/api/finance', financeRouter);
app.use('/api/suppliers', suppliersRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Retail OS Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   POS:    POST http://localhost:${PORT}/api/pos/checkout`);
});

export default app;
