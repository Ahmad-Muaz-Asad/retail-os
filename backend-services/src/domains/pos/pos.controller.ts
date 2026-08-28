/**
 * POS Controller Layer
 * Domain: Point of Sale
 * Responsibility: HTTP request/response handling. Delegates all logic to PosService.
 */

import { Request, Response } from 'express';
import { posService, CheckoutPayload } from './pos.service';

export class PosController {
    /**
     * POST /api/pos/checkout
     * Accepts a checkout payload and processes the POS transaction.
     */
    async checkout(req: Request, res: Response): Promise<void> {
        try {
            const payload = req.body as CheckoutPayload;

            // --- Basic Input Validation ---
            if (!payload.tenantId || !payload.saleId || payload.totalAmount === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'tenantId, saleId, and totalAmount are required fields.',
                });
                return;
            }

            if (!Array.isArray(payload.items) || payload.items.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Cart must contain at least one item.',
                });
                return;
            }

            const result = await posService.processCheckout(payload);
            res.status(200).json(result);
        } catch (error) {
            console.error('[PosController] Checkout error:', error);
            res.status(500).json({
                success: false,
                message: 'An internal server error occurred during checkout.',
            });
        }
    }

    /**
     * GET /api/pos/products
     * Returns all products for a given tenant.
     */
    async getProducts(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const products = await posService.getProducts(tenantId);

            const mappedProducts = products.map((p: any) => ({
                id: p.SK.split('#')[1],
                ...p
            }));

            res.status(200).json(mappedProducts);
        } catch (error) {
            console.error('[PosController] Error getting products:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    /**
     * GET /api/pos/sales
     * Returns all sales for a given tenant.
     */
    async getSales(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const sales = await posService.getSales(tenantId);

            const mappedSales = sales.map((s: any) => ({
                id: s.saleId || s.SK.split('#').slice(2).join('#'),
                ...s
            }));

            res.status(200).json(mappedSales);
        } catch (error) {
            console.error('[PosController] Error getting sales:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const posController = new PosController();
