import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';

export class InventoryController {
    /**
     * POST /api/inventory/products
     * Creates or overwrites a specific product allowing for bidirectional syncing.
     */
    async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const product = req.body;

            if (!product.id) {
                res.status(400).json({ success: false, message: 'Product payload must have an "id" field' });
                return;
            }

            const result = await inventoryService.createOrUpdateProduct(tenantId, product);
            res.status(200).json(result);
        } catch (error) {
            console.error('[InventoryController] Error saving product:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const inventoryController = new InventoryController();
