import { Router } from 'express';
import { inventoryController } from './inventory.controller';

const router = Router();

/**
 * POST /api/inventory/products
 * Updates or creates a product payload allowing local offline RxDB creation sync.
 */
router.post('/products', (req, res) => inventoryController.createProduct(req, res));

export default router;
