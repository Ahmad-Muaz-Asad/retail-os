import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { client } from '../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

async function createTable() {
    const command = new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },  // Partition Key: TENANT#<shop_id>
            { AttributeName: 'SK', KeyType: 'RANGE' }, // Sort Key: Entity type & ID (e.g., PRODUCT#<uuid>)
        ],
        AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    });

    try {
        const data = await client.send(command);
        console.log(`Table "${TABLE_NAME}" created successfully.`);
        console.log(data);
    } catch (err: any) {
        if (err.name === 'ResourceInUseException') {
            console.log(`Table "${TABLE_NAME}" already exists.`);
        } else {
            console.error('Error creating table:', err);
        }
    }
}

createTable();
