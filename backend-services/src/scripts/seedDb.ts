import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../lib/db';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'RetailOSTable';

const products = [
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_ketchup',
        entityType: 'PRODUCT',
        productId: 'prod_ketchup',
        name: 'National Ketchup',
        price: 450,
        stock: 50,
        category: 'Groceries',
        defaultDiscount: 0
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_tea',
        entityType: 'PRODUCT',
        productId: 'prod_tea',
        name: 'Tapal Danedar',
        price: 1200,
        stock: 100,
        category: 'Groceries',
        defaultDiscount: 5
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_beef',
        entityType: 'PRODUCT',
        productId: 'prod_beef',
        name: 'Premium Beef (1kg)',
        price: 2200,
        stock: 25,
        category: 'Meat',
        defaultDiscount: 0
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_soap',
        entityType: 'PRODUCT',
        productId: 'prod_soap',
        name: 'Safeguard Soap',
        price: 150,
        stock: 200,
        category: 'Toiletries',
        defaultDiscount: 0
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_pepsi',
        entityType: 'PRODUCT',
        productId: 'prod_pepsi',
        name: 'Pepsi (1.5L)',
        price: 250,
        stock: 80,
        category: 'Beverages',
        defaultDiscount: 0
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'PRODUCT#prod_rice',
        entityType: 'PRODUCT',
        productId: 'prod_rice',
        name: 'Basmati Rice (5kg)',
        price: 1600,
        stock: 40,
        category: 'Groceries',
        defaultDiscount: 0
    },
    // --- Customers ---
    {
        PK: 'TENANT#tenant_1',
        SK: 'CUSTOMER#cust_1',
        entityType: 'CUSTOMER',
        customerId: 'cust_1',
        name: 'Ali Khan',
        phone: '03001234567',
        loyaltyPoints: 100
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'CUSTOMER#cust_2',
        entityType: 'CUSTOMER',
        customerId: 'cust_2',
        name: 'Sara Ahmed',
        phone: '03339876543',
        loyaltyPoints: 250
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'CUSTOMER#cust_3',
        entityType: 'CUSTOMER',
        customerId: 'cust_3',
        name: 'Usman Tariq',
        phone: '03450000000',
        loyaltyPoints: 0
    },
    // --- Employees ---
    {
        PK: 'TENANT#tenant_1',
        SK: 'EMPLOYEE#emp_1',
        entityType: 'EMPLOYEE',
        employeeId: 'emp_1',
        name: 'Ahmed Manager',
        role: 'MANAGER',
        status: 'ACTIVE'
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'EMPLOYEE#emp_2',
        entityType: 'EMPLOYEE',
        employeeId: 'emp_2',
        name: 'Bilal Cashier',
        role: 'CASHIER',
        status: 'ACTIVE'
    },
    {
        PK: 'TENANT#tenant_1',
        SK: 'EMPLOYEE#emp_3',
        entityType: 'EMPLOYEE',
        employeeId: 'emp_3',
        name: 'Zainab HR',
        role: 'HR',
        status: 'ACTIVE'
    }
];

async function seedDatabase() {
    console.log(`Starting to seed ${products.length} entities into table '${TABLE_NAME}'...`);

    let successCount = 0;
    let failureCount = 0;

    for (const product of products) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: product
            });
            await docClient.send(command);
            successCount++;
            console.log(`✅ Seeded: ${product.name}`);
        } catch (error) {
            failureCount++;
            console.error(`❌ Failed to seed: ${product.name}`, error);
        }
    }

    console.log(`\nSeed Summary: ${successCount} successful, ${failureCount} failed.`);
}

seedDatabase();
