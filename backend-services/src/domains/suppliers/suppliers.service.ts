import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'RetailOS_SingleTable';

export class SuppliersService {
    async createSupplier(tenantId: string, payload: any): Promise<any> {
        const pk = `TENANT#${tenantId}`;
        const { syncStatus, ...cleanPayload } = payload;
        const sk = `SUPPLIER#${cleanPayload.id}`;

        const item = {
            PK: pk,
            SK: sk,
            ...cleanPayload,
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        });

        await docClient.send(command);
        return { success: true, id: payload.id };
    }

    async getSuppliers(tenantId: string): Promise<any[]> {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `TENANT#${tenantId}`,
                ':skPrefix': 'SUPPLIER#',
            },
        });

        const response = await docClient.send(command);
        return (response.Items || []).map((item) => {
            const { PK, SK, entityType, tenantId, ...rest } = item;
            return rest;
        });
    }
}

export const suppliersService = new SuppliersService();
