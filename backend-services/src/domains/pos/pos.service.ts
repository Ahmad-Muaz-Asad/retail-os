/**
 * POS Service Layer
 * Domain: Point of Sale
 * Responsibility: Business logic & DynamoDB orchestration (single-table design).
 * NOTE: DynamoDB client will be wired in a later phase. Stubs are provided here.
 */

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

export interface CheckoutItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    discount?: number;
}

export interface CheckoutPayload {
    tenantId: string;
    saleId: string;
    totalAmount: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    status?: 'COMPLETED' | 'HOLD' | 'PENDING_SYNC';
    items: CheckoutItem[];
    employeeId?: string;
    customerId?: string;
    paymentMethod?: 'CASH' | 'CARD' | 'SPLIT';
    createdAt?: string;
}

export interface CheckoutResult {
    success: boolean;
    invoiceId: string;
    totalAmount: number;
    message: string;
}

export class PosService {
    /**
     * Processes a checkout transaction using DynamoDB TransactWriteItems.
     * Validates stock, calculates totals, persists Sale record,
     * and decrements stock for each item atomically.
     */
    async processCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
        const timestamp = payload.createdAt || new Date().toISOString();
        const transactItems: any[] = [];

        // 1. Create Sale Record
        transactItems.push({
            Put: {
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${payload.tenantId}`,
                    SK: `SALE#${timestamp}#${payload.saleId}`,
                    entityType: 'SALE',
                    saleId: payload.saleId,
                    totalAmount: payload.totalAmount,
                    subtotal: payload.subtotal || 0,
                    tax: payload.tax || 0,
                    discount: payload.discount || 0,
                    status: payload.status || 'COMPLETED',
                    items: payload.items,
                    employeeId: payload.employeeId || 'UNKNOWN',
                    customerId: payload.customerId || 'WALK_IN',
                    paymentMethod: payload.paymentMethod || 'CASH',
                    createdAt: timestamp
                }
            }
        });

        // 1.5 Process Loyalty Points
        const earnedPoints = Math.floor(payload.totalAmount / 10);
        const redeemedPoints = payload.discount || 0;
        const pointDelta = earnedPoints - redeemedPoints;

        if (payload.customerId && payload.customerId !== 'WALK_IN') {
            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `TENANT#${payload.tenantId}`,
                        SK: `CUSTOMER#${payload.customerId}`
                    },
                    UpdateExpression: 'SET loyaltyPoints = if_not_exists(loyaltyPoints, :zero) + :delta',
                    ExpressionAttributeValues: {
                        ':zero': 0,
                        ':delta': pointDelta
                    }
                }
            });
        }

        // 2. Decrement stock for each item (prevents negative stock via ConditionExpression)
        for (const item of payload.items) {
            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `TENANT#${payload.tenantId}`,
                        SK: `PRODUCT#${item.productId}`
                    },
                    UpdateExpression: 'SET stock = stock - :qty',
                    ConditionExpression: 'stock >= :qty', // STRICT LOGIC: Prevents negative stock checkout
                    ExpressionAttributeValues: {
                        ':qty': item.quantity
                    }
                }
            });
        }

        try {
            const command = new TransactWriteCommand({
                TransactItems: transactItems
            });

            await docClient.send(command);
            console.log(`[PosService] Checkout processed | Invoice: ${payload.saleId} | Total: ${payload.totalAmount}`);

            return {
                success: true,
                invoiceId: payload.saleId,
                totalAmount: payload.totalAmount,
                message: 'Checkout transaction completed successfully.',
            };
        } catch (error: any) {
            console.error('[PosService] Transaction failed:', error);

            // If the transaction is cancelled due to ConditionCheckFailed (stock run out)
            if (error.name === 'TransactionCanceledException') {
                throw new Error('Checkout failed: One or more products have insufficient stock.');
            }
            throw new Error(`Checkout failed due to a database error: ${error.message}`);
        }
    }

    /**
     * Retrieves all products from DynamoDB for a specific tenant.
     */
    async getProducts(tenantId: string) {
        const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');

        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'PRODUCT#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[PosService] Error fetching products:', error);
            throw new Error('Failed to fetch products');
        }
    }

    /**
     * Retrieves all sales from DynamoDB for a specific tenant.
     */
    async getSales(tenantId: string) {
        const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');

        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'SALE#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[PosService] Error fetching sales:', error);
            throw new Error('Failed to fetch sales');
        }
    }
}

export const posService = new PosService();

