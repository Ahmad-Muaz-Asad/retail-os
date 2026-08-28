import { Request, Response } from 'express';
import { suppliersService } from './suppliers.service';

export class SuppliersController {
    async getSuppliers(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const suppliers = await suppliersService.getSuppliers(tenantId);
            res.status(200).json(suppliers);
        } catch (error) {
            console.error('[SuppliersController] Error fetching suppliers:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async createSupplier(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const payload = req.body;
            if (!payload.id) {
                res.status(400).json({ success: false, message: 'Missing id' });
                return;
            }
            const result = await suppliersService.createSupplier(tenantId, payload);
            res.status(200).json(result);
        } catch (error) {
            console.error('[SuppliersController] Error creating supplier:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const suppliersController = new SuppliersController();
