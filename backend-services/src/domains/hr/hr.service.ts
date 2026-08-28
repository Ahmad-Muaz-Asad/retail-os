import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

export class HrService {
    async getEmployees(tenantId: string) {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'EMPLOYEE#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[HrService] Error fetching employees:', error);
            throw new Error('Failed to fetch employees');
        }
    }

    async createEmployee(tenantId: string, payload: any) {
        try {
            const { syncStatus, ...cleanPayload } = payload;
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${tenantId}`,
                    SK: `EMPLOYEE#${cleanPayload.id}`,
                    entityType: 'EMPLOYEE',
                    ...cleanPayload
                }
            });
            await docClient.send(command);
            return { success: true, id: payload.id };
        } catch (error) {
            console.error('[HrService] Error saving employee:', error);
            throw new Error('Failed to save employee');
        }
    }

    async createAttendance(tenantId: string, payload: any) {
        try {
            const { syncStatus, ...cleanPayload } = payload;
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TENANT#${tenantId}`,
                    SK: `ATTENDANCE#${cleanPayload.id}`,
                    entityType: 'ATTENDANCE',
                    attendanceId: cleanPayload.id,
                    ...cleanPayload
                }
            });
            await docClient.send(command);
            return { success: true, id: payload.id };
        } catch (error) {
            console.error('[HrService] Error saving attendance:', error);
            throw new Error('Failed to save attendance');
        }
    }

    async getAttendance(tenantId: string) {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                ExpressionAttributeValues: {
                    ':pk': `TENANT#${tenantId}`,
                    ':skPrefix': 'ATTENDANCE#'
                }
            });
            const result = await docClient.send(command);
            return (result.Items || []).map(item => {
                const { PK, SK, entityType, tenantId, ...rest } = item;
                return rest;
            });
        } catch (error) {
            console.error('[HrService] Error fetching attendance:', error);
            throw new Error('Failed to fetch attendance');
        }
    }
}

export const hrService = new HrService();
