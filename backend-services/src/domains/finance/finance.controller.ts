import { Request, Response } from 'express';
import { financeService } from './finance.service';

export class FinanceController {
    async createExpense(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const expense = req.body;

            if (!expense.id) {
                res.status(400).json({ success: false, message: 'Expense missing id' });
                return;
            }

            const result = await financeService.createExpense(tenantId, expense);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async getExpenses(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const expenses = await financeService.getExpenses(tenantId);
            const mapped = expenses.map((e: any) => ({
                id: e.expenseId || e.SK.split('#')[1],
                ...e
            }));
            res.status(200).json(mapped);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const financeController = new FinanceController();
