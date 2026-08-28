import { Router } from 'express';
import { financeController } from './finance.controller';

const router = Router();

router.post('/expenses', financeController.createExpense);
router.get('/expenses', financeController.getExpenses);

export default router;
