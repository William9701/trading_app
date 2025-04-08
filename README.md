# FX Trading App - Backend Engineering Assessment

Welcome to the **FX Trading App**! This is a backend application for a currency exchange platform where users can trade currencies like Naira (NGN) against various international currencies (USD, EUR, GBP, etc.). The app supports features such as user registration, email verification, wallet management, currency conversion, and trading.

## Company: CredPal

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Functional Requirements](#functional-requirements)
4. [API Endpoints](#api-endpoints)
5. [Setup Instructions](#setup-instructions)
6. [Demo](#demo)
7. [Testing](#testing)
8. [Swagger Documentation](#swagger-documentation)
9. [License](#license)

---

## Project Overview

You're tasked with building the backend for an **FX Trading App**. The application allows users to trade Naira (NGN) against other currencies like USD, EUR, and GBP. The system fetches real-time FX rates and allows users to perform actions such as:

- **Registering and verifying their email.**
- **Funding their wallet and performing transfers.**
- **Trading Naira (NGN) against other currencies (USD, EUR, GBP, etc.) and vice versa.**

### Key Features

- **User Registration & Verification**: Users can register with their email and receive an OTP for verification.
- **Multi-Currency Wallet**: Users can fund their wallets and perform currency conversions and trades.
- **Real-Time FX Rates**: Fetch real-time FX rates from an external API.
- **Currency Conversion & Trading**: Allow users to trade between NGN and other currencies.
- **Transaction History**: Keep a record of all transactions, including funds, conversions, and trades.

---

## Tech Stack

- **Backend Framework**: NestJS
- **ORM**: TypeORM
- **Database**: MySQL
- **Email Provider**: Nodemiller for sending emails
- **Cache**: CACHE_MANAGER for storing FX rates temporarily
- **API Documentation**: Swagger
- **External FX Rate API**: [Exchangerate API](https://www.exchangerate-api.com)

---

## Functional Requirements

1. **User Registration & Email Verification**:
   - Users can register using an email address and receive an OTP for verification.
   - Only verified users can access trading features.

2. **User Wallet**:
   - Each user has a wallet with balances in different currencies (e.g., NGN, USD, EUR).
   - Users can fund their wallets, starting with Naira (NGN).

3. **FX Rate Integration**:
   - Fetch real-time FX rates from an external API.
   - Store the rates temporarily in Redis for better performance.

4. **Currency Conversion & Trading**:
   - Convert or trade between NGN and other currencies using real-time FX rates.
   - Ensure accurate balance updates and rate usage.

5. **Transaction History**:
   - Maintain a history of all actions: funding, conversion, and trading.

---

## API Endpoints

Here are the key API routes that power the FX Trading App, with examples using `curl`:

### 1. **Register User**

```bash
curl -X POST http://localhost:3005/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "obi_william@yahoo.com", "password": "Password123!", "role": "admin"}'
```

**Expected Outcome:**

```json
{
  "message": "User registered successfully, OTP sent to email"
}
```

---

### 2. **Verify User Email**

```bash
curl -X POST http://localhost:3005/auth/verify \
-H "Content-Type: application/json" \
-d '{"email": "obi_william@yahoo.com", "otp": "880076"}'
```

**Expected Outcome:**

```json
{
  "message": "User verified successfully"
}
```

---

### 3. **Login User**

```bash
curl -X POST http://localhost:3005/auth/login \
-H "Content-Type: application/json" \
-c cookies.txt \
-d '{"email": "williamobi818@gmail.com", "password": "Password123!"}'
```

**Expected Outcome:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3MzI4MmIxLTk4ZjktNGQ1ZS1hNTQ3LTI5M2U2MjU5MWQzOCIsImVtYWlsIjoid2lsbGlhbW9iaTgxOEBnbWFpbC5jb20iLCJpYXQiOjE3NDQwNjc1ODUsImV4cCI6MTc0NDA3MTE4NX0.Fzhp_c0jU_phMRop_HXJNDEDN_tFPvakhPDHWtfyLtM"
}
```

---

### 4. **View Wallet**

```bash
curl -X GET -b cookies.txt http://localhost:3005/wallet
```

**Expected Outcome:**

```json
{
  "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
  "baseCurrency": "NGN",
  "createdAt": "2025-04-08T02:01:06.252Z",
  "updatedAt": "2025-04-08T02:01:06.252Z",
  "balances": [
    {
      "id": "210e1c8b-8e65-4767-9ca7-49bfd07e6f8d",
      "currency": "USD",
      "amount": "57100.50"
    },
    {
      "id": "a2231b6d-97d5-4d38-9e5d-3674a7a92bae",
      "currency": "EUR",
      "amount": "0.00"
    },
    {
      "id": "c7532293-3bc4-4ad2-98bb-f981f12a4616",
      "currency": "NGN",
      "amount": "1597138.20"
    }
  ]
}
```

---

### 5. **Fund Wallet**

```bash
curl -X POST http://localhost:3005/wallet/fund \
-H "Content-Type: application/json" \
-b cookies.txt \
-d '{"currency": "USD", "amount": 100.5}'
```

**Expected Outcome:**

```json
{
  "message": "Wallet funded successfully",
  "balance": {
    "message": "Wallet funded successfully",
    "transaction": {
      "id": "8020b18c-5ef2-4c56-be04-94cfc5efdb9b",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z",
        "balances": [
          {
            "id": "210e1c8b-8e65-4767-9ca7-49bfd07e6f8d",
            "currency": "USD",
            "amount": 7745201
          },
          {
            "id": "a2231b6d-97d5-4d38-9e5d-3674a7a92bae",
            "currency": "EUR",
            "amount": "0.00"
          },
          {
            "id": "c7532293-3bc4-4ad2-98bb-f981f12a4616",
            "currency": "NGN",
            "amount": "1597138.20"
          }
        ]
      },
      "currency": "USD",
      "amount": 100.5,
      "rate": null,
      "type": "FUNDING",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T09:23:19.831Z",
      "reference": "04d20d50-0382-4de6-945a-ebe1237e7a87",
      "remarks": "Funded 100.5 USD"
    }
  }
}
```

---

### 6. **Convert Currencies**

```bash
curl -X POST http://localhost:3005/wallet/convert \
-H "Content-Type: application/json" \
-b cookies.txt \
-d '{"fromCurrency": "USD", "toCurrency": "NGN", "amount": 7600}'
```

**Expected Outcome:**

```json
{
  "message": "Currency converted successfully",
  "data": {
    "message": "Conversion successful",
    "from": {
      "currency": "USD",
      "deducted": 7600
    },
    "to": {
      "currency": "NGN",
      "added": 12138250.34
    },
    "rate": 1597.138202
  }
}
```

---

### 7. **Trade Currencies**

```bash
curl -X POST http://localhost:3005/wallet/trade \
-H "Content-Type: application/json" \
-b cookies.txt \
-d '{"fromCurrency": "NGN", "toCurrency": "USD", "amount": 152906}'
```

**Expected Outcome:**

```json
{
  "message": "Currency traded successfully",
  "data": {
    "message": "Trade successful",
    "from": {
      "currency": "NGN",
      "deducted": 152906
    },
    "to": {
      "currency": "USD",
      "added": 93.051
    },
    "rate": 0.000621
  }
}
```

---

### 8. **Get FX Rates**

```bash
curl -X GET -b cookies.txt http://localhost:3005/fx/rates
```

**Expected Outcome:**

```json
{
  "status": "success",
  "rates": {
    "NGN": 1,
    "USD": 0.002,
    "EUR": 0.0018
  }
}
```

---

### 9. **View Transaction History**

```bash
curl -X GET -b cookies.txt http://localhost:3005/transactions
```

**Expected Outcome:**

```json
{
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": "66d0872a-f2c1-48d0-96a8-080187ceb7d8",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "NGN",
      "amount": "152906.00000000",
      "rate": "0.00062100",
      "type": "TRADE",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T09:27:46.954Z",
      "reference": "2d4dbcde-6819-458e-863f-d60906e80afb",
      "remarks": "Traded 152906 NGN to 93.051 USD at rate 0.000621"
    },
    {
      "id": "b355e779-f544-4397-869d-f9a13a3941b8",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "7600.00000000",
      "rate": "1597.13820200",
      "type": "CONVERSION",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T09:25:52.530Z",
      "reference": "80743381-4641-45dd-a837-681e3c8d8652",
      "remarks": "Converted 7600 USD to 12138250.34 NGN at rate 1597.138202"
    },
    {
      "id": "8020b18c-5ef2-4c56-be04-94cfc5efdb9b",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "100.50000000",
      "rate": null,
      "type": "FUNDING",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T09:23:19.831Z",
      "reference": "04d20d50-0382-4de6-945a-ebe1237e7a87",
      "remarks": "Funded 100.5 USD"
    },
    {
      "id": "6be0e7fa-a30c-48dd-88f6-e5d9996e7104",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "7688000.00000000",
      "rate": null,
      "type": "FUNDING",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T08:58:38.718Z",
      "reference": "40d09da0-5e0b-47cf-9e1c-4d86de53913e",
      "remarks": "Funded 7688000 USD"
    },
    {
      "id": "e4b8619a-c718-48d0-8b18-60b748066f00",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "1000.00000000",
      "rate": "1597.13820200",
      "type": "CONVERSION",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T02:16:01.230Z",
      "reference": "77dbe322-adfa-4fad-a4c1-e2d48a9960a6",
      "remarks": "Converted 1000 USD to 1597138.2 NGN at rate 1597.138202"
    },
    {
      "id": "9fc373b4-3dc8-4ac1-b9c9-cb6c9fb16e8f",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "100.50000000",
      "rate": null,
      "type": "FUNDING",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T02:12:08.737Z",
      "reference": "dfc69872-1cf5-4ff1-aee0-b56951c0d1bd",
      "remarks": "Funded 100.5 USD"
    },
    {
      "id": "dea680c5-b430-44aa-8897-7a5a370e7116",
      "wallet": {
        "id": "af19ef61-000c-4c8e-a991-8a3fc1d6ecab",
        "baseCurrency": "NGN",
        "createdAt": "2025-04-08T02:01:06.252Z",
        "updatedAt": "2025-04-08T02:01:06.252Z"
      },
      "currency": "USD",
      "amount": "58000.00000000",
      "rate": null,
      "type": "FUNDING",
      "status": "SUCCESS",
      "timestamp": "2025-04-08T02:09:02.985Z",
      "reference": "ebd7ec53-e057-4c7b-8ba7-8481ba91b071",
      "remarks": "Funded 58000 USD"
    }
  ]
}
```

---

### 10. **Logout User**

```bash
curl -X GET -b cookies.txt http://localhost:3005/auth/logout
```

**Expected Outcome:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Setup Instructions

Follow the steps below to set up and run the application locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/credpal-fx-trading-app.git
   cd credpal-fx-trading-app
   ```

2. **Create the `.env` file** in the root directory with the following contents:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=root
   DB_NAME=cred_pal

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_smtp_password
   SMTP_SENDER=your_email

   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run migrations** to set up the database schema:
   ```bash
   npm run migration:run
   ```

5. **Start the application**:
   ```bash
   npm run start:dev
   ```

   The application will be running on `http://localhost:3005`.

---

## Demo

A video demonstration of the app will be added soon. Stay tuned for a walkthrough of the application!

---

## Testing

While testing is optional, we highly encourage you to add tests for critical logic such as wallet funding, currency conversion, and transaction history.

To run the tests, use the following command:

```bash
npm run test
```

---

## Swagger Documentation

For a detailed view of all available endpoints and their parameters, visit the Swagger UI at:

[Swagger Documentation](http://localhost:3005/api)

---

## License

MIT License. See [LICENSE](LICENSE) for more information.

---

This README now includes all relevant sections, including the route `curl` commands and expected outcomes for easy testing. The Swagger link has also been provided for easy visualization of the API.