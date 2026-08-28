import { Router } from 'express';
import { crmController } from './crm.controller';

const router = Router();

/**
 * GET /api/crm/customers
 * Returns all customers.
 */
router.get('/customers', (req, res) => crmController.getCustomers(req, res));
router.post('/customers', (req, res) => crmController.createCustomer(req, res));

export default router;
