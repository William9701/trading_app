
```markdown
# System Architecture & Flow Diagram for FX Trading App

## Overview

This document provides an overview of the architecture, flow, and processes involved in the FX Trading App. The app supports functionalities like user registration, wallet management, currency conversion, real-time FX rates integration, and trade execution.

### Key Components:
1. **User Registration & Verification**
2. **Wallet Management**
3. **Currency Exchange (Conversion & Trading)**
4. **Real-time FX Rates**
5. **Transaction History**

---

## 1. **User Registration & Email Verification**

### Flow Diagram:
```markdown
+-------------------+
| User Submits Info |
+-------------------+
        |
        v
+-------------------------+
| Validate Input (Email,   |
| Password, Role)          |
+-------------------------+
        |
        v
+-----------------------+
| Generate OTP & Send   |
| Email Verification    |
+-----------------------+
        |
        v
+------------------------+
| Wait for OTP Entry     |
+------------------------+
        |
        v
+------------------------+
| Verify OTP and Activate|
| User Account           |
+------------------------+
        |
        v
+-----------------------+
| Account Activated &    |
| User Access Granted    |
+-----------------------+
```

---

## 2. **Wallet Management**

### Flow Diagram:
```
+-----------------------+
| User Logs In          |
+-----------------------+
        |
        v
+------------------------+
| Validate User Session  |
| (Use Cookies)          |
+------------------------+
        |
        v
+-------------------------+
| Fetch User Wallet Info  |
| (Currencies, Balances)  |
+-------------------------+
        |
        v
+------------------------+
| Display Wallet          |
| Information            |
+------------------------+
        |
        v
+------------------------+
| User Funds Wallet      |
+------------------------+
```

---

## 3. **Currency Exchange (Conversion & Trading)**

### Conversion Flow Diagram:
```
+------------------------+
| User Requests Conversion|
+------------------------+
        |
        v
+----------------------------+
| Validate Conversion Inputs |
| (Currency, Amount)         |
+----------------------------+
        |
        v
+-----------------------------+
| Fetch Real-Time FX Rates    |
+-----------------------------+
        |
        v
+-----------------------------+
| Perform Conversion (USD → NGN)|
+-----------------------------+
        |
        v
+-----------------------------+
| Update User Wallet Balance  |
+-----------------------------+
        |
        v
+-----------------------------+
| Transaction History Updated |
+-----------------------------+
```

### Trading Flow Diagram:
```
+---------------------------+
| User Requests Trade       |
+---------------------------+
        |
        v
+----------------------------+
| Validate Trade Inputs      |
| (From, To Currency, Amount)|
+----------------------------+
        |
        v
+-----------------------------+
| Fetch Real-Time FX Rates    |
+-----------------------------+
        |
        v
+-----------------------------+
| Perform Trade (NGN → USD)   |
+-----------------------------+
        |
        v
+-----------------------------+
| Update Wallet Balance (NGN) |
| & Transaction History       |
+-----------------------------+
```

---

## 4. **Real-time FX Rates Integration**

### Flow Diagram:
```
+---------------------------+
| Fetch Real-Time FX Rates  |
| from Third-Party API      |
+---------------------------+
        |
        v
+---------------------------+
| Cache FX Rates in CACHE_MANAGER   |
+---------------------------+
        |
        v
+---------------------------+
| Use Cached Rates for      |
| Conversion and Trading    |
+---------------------------+
```

---

## 5. **Transaction History Management**

### Flow Diagram:
```
+---------------------------+
| Record Transaction        |
| (Conversion/Trade)        |
+---------------------------+
        |
        v
+---------------------------+
| Save Transaction to       |
| Database (Timestamp, Rate,|
| Amount, Type, Status)     |
+---------------------------+
        |
        v
+---------------------------+
| User Views Transaction    |
| History                   |
+---------------------------+
```

---

## Architectural Components & Structure

### **Backend Architecture**
- **NestJS**: The backend framework used to build the RESTful APIs.
- **TypeORM**: The ORM for database operations.
- **MySQL/PostgreSQL**: The database choice for storing user and transaction data.
- **CACHE_MANAGER**: Caching service used for storing real-time FX rates to improve performance.
- **SMTP Server (Gmail SMTP)**: For sending OTP emails for registration/verification.

### **API Routes Overview**
- **/auth/register**: Register a new user and trigger OTP email.
- **/auth/verify**: Verify OTP and activate account.
- **/wallet/fund**: Fund the user's wallet with a specified amount.
- **/wallet/convert**: Convert one currency to another (using real-time FX rates).
- **/wallet/trade**: Perform trade between Naira (NGN) and other currencies.
- **/fx/rates**: Retrieve current FX rates for supported currency pairs.
- **/transactions**: View user transaction history.

---

## Assumptions
1. Users can only access currency trading features after verifying their email.
2. Real-time FX rates are fetched from a third-party API and cached in CACHE_MANAGER for performance.
3. A user's wallet supports multiple currencies, and balances are updated after every conversion or trade.
4. Every action (funding, conversion, trade) is logged in the transaction history.

---

## Future Considerations
1. **Scalability**: The system should be designed to handle millions of users and transactions. A horizontal scaling approach can be used for scaling databases and caching systems.
2. **Multi-Currency Support**: The system can be extended to support additional currencies and trading pairs.
3. **Role-Based Access Control**: Admin roles for managing users, transactions, and FX rates.
4. **Analytics**: Implementing tracking and logging to analyze user activity, trading trends, and system health.
```
