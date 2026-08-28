import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

export class InventoryService {
    /**
     * Creates or updates a product via PutItem implementation.
     */
    async createOrUpdateProduct(tenantId: string, product: any) {
        try {
            const { syncStatus, ...cleanProduct } = product;
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${tenantId}`,
                    SK: `PRODUCT#${cleanProduct.id}`,
                    entityType: 'PRODUCT',
                    productId: cleanProduct.id,
                    ...cleanProduct
                }
            });
            await docClient.send(command);
            return { success: true, id: product.id };
        } catch (error) {
            console.error('[InventoryService] Error saving product:', error);
            throw new Error('Failed to save product');
        }
    }
}

export const inventoryService = new InventoryService();
