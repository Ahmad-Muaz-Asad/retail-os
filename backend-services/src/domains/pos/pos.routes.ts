/**
 * POS Routes
 * Domain: Point of Sale
 * Responsibility: Declare Express routes and bind them to controller methods.
 */

import { Router } from 'express';
import { posController } from './pos.controller';

const router = Router();

/**
 * GET /api/pos/products
 * Returns all products.
 */
router.get('/products', (req, res) => posController.getProducts(req, res));

/**
 * GET /api/pos/sales
 * Returns all sales.
 */
router.get('/sales', (req, res) => posController.getSales(req, res));

/**
 * POST /api/pos/checkout
 * Processes a cart checkout — validates stock, calculates totals, records the sale.
 */
router.post('/checkout', (req, res) => posController.checkout(req, res));

export default router;
