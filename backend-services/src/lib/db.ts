import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
dotenv.config();

const REGION = process.env.AWS_REGION || 'ap-south-1';
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';

const client = new DynamoDBClient({
    region: REGION,
    endpoint: DYNAMODB_ENDPOINT,
    credentials: {
        // Dummy credentials for local DynamoDB
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
    }
});

// Configure the Document Client for simpler data interactions
const translateConfig = {
    marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
        wrapNumbers: false,
    },
};

export const docClient = DynamoDBDocumentClient.from(client, translateConfig);
export { client };
