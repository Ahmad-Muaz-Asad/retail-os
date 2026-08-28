# Retail OS

## 1. PROJECT OVERVIEW
This repository contains a comprehensive Retail OS application, structured into two main components:
* **Frontend:** A Next.js Offline-First Progressive Web App (PWA) using RxDB for client-side data management and synchronization.
* **Backend:** An Express API built with Node.js, leveraging a DynamoDB Single-Table design for the database architecture.

This architecture ensures a resilient, offline-capable application that can sync data intelligently when internet connectivity is restored.

## 2. PREREQUISITES
Before you begin, ensure you have the following installed on your local machine:
* **Node.js** (v18 or higher recommended)
* **Docker Desktop** (Required for spinning up the local DynamoDB container)

## 3. ENVIRONMENT SETUP
To configure the backend environment, you need to set up your environment variables. 
Navigate to the `backend-services` directory and create a `.env` file with the following contents exactly as shown:

```env
PORT=4000
DYNAMODB_TABLE_NAME=RetailOSTable
```

## 4. STEP-BY-STEP INSTALLATION

### Install Dependencies
You need to install the NPM dependencies for both the frontend and backend applications. Open your terminal and run the following commands:

**Backend:**
```bash
cd backend-services
npm install
```

**Frontend:**
```bash
cd frontend-app
npm install
```

### Spin up Local Database
Ensure Docker Desktop is running, then start the local DynamoDB container. From the backend directory, run:
```bash
cd backend-services
docker compose up -d
```

### Initialize and Seed Database
Set up the DynamoDB table and populate it with initial seed data:
```bash
cd backend-services
npx ts-node src/scripts/createTable.ts
npx ts-node src/scripts/seedDb.ts
```

### Start the Application
Run the development servers for both the backend and frontend.

**Start the Backend:**
```bash
cd backend-services
npm run dev
```

**Start the Frontend:**
```bash
cd frontend-app
npm run dev
```

## 5. OFFLINE TESTING
To test the offline capabilities of the Progressive Web App:
1. Open the application in your browser (typically `http://localhost:3000`).
2. Open the browser's Developer Tools (F12 or right-click and select "Inspect").
3. Navigate to the **Network** tab.
4. Select the **Offline** preset from the application's throttling dropdown to simulate network loss.
5. Perform actions in the application (like creating, editing, or viewing items). RxDB will handle storing these modifications locally.
6. Switch back to **No throttling** (Online), and observe the background synchronization engine seamlessly pushing your offline changes directly to the back-end Express API.
