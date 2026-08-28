import { Request, Response } from 'express';
import { crmService } from './crm.service';

export class CrmController {
    /**
     * GET /api/crm/customers
     * Returns all customers.
     */
    async getCustomers(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const customers = await crmService.getCustomers(tenantId);

            const mappedCustomers = customers.map((c: any) => ({
                id: c.SK.split('#')[1],
                ...c
            }));

            res.status(200).json(mappedCustomers);
        } catch (error) {
            console.error('[CrmController] Error getting customers:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async createCustomer(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const payload = req.body;
            if (!payload.id) {
                res.status(400).json({ success: false, message: 'Missing id' });
                return;
            }
            const result = await crmService.createCustomer(tenantId, payload);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const crmController = new CrmController();
