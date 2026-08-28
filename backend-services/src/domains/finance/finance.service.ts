import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

export class FinanceService {
    async createExpense(tenantId: string, expense: any) {
        try {
            const { syncStatus, ...cleanExpense } = expense;
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${tenantId}`,
                    SK: `EXPENSE#${cleanExpense.id}`,
                    entityType: 'EXPENSE',
                    expenseId: cleanExpense.id,
                    ...cleanExpense
                }
            });
            await docClient.send(command);
            return { success: true, id: expense.id };
        } catch (error) {
            console.error('[FinanceService] Error saving expense:', error);
            throw new Error('Failed to save expense');
        }
    }

    async getExpenses(tenantId: string) {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'EXPENSE#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[FinanceService] Error fetching expenses:', error);
            throw new Error('Failed to fetch expenses');
        }
    }
}

export const financeService = new FinanceService();
