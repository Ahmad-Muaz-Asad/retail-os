import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

export class CrmService {
    async getCustomers(tenantId: string) {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'CUSTOMER#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[CrmService] Error fetching customers:', error);
            throw new Error('Failed to fetch customers');
        }
    }

    async createCustomer(tenantId: string, payload: any) {
        try {
            const { syncStatus, ...cleanPayload } = payload;
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${tenantId}`,
                    SK: `CUSTOMER#${cleanPayload.id}`,
                    entityType: 'CUSTOMER',
                    ...cleanPayload
                }
            });
            await docClient.send(command);
            return { success: true, id: payload.id };
        } catch (error) {
            console.error('[CrmService] Error saving customer:', error);
            throw new Error('Failed to save customer');
        }
    }
}

export const crmService = new CrmService();
