# ABAC-Lite Authorization System

A robust, strictly-typed backend application implementing Attribute-Based Access Control (ABAC) using NestJS,
PostgreSQL, CASL, and JWE.

## Overview

It implements a secure API with three levels of authorization:

* Endpoint Authorization: Protecting routes based on roles (RBAC).

* Resource Authorization: Ensuring users can only access their own resources (Ownership).

* Attribute Authorization: Filtering sensitive data fields based on the viewer's role (e.g., hiding salary from
  non-admins).

## Tech Stack & Decisions

### Core Framework

* NestJS: Chosen for its modular architecture, strong TypeScript support, and widespread industry adoption. It enforces
  good practices like Dependency Injection and Separation of Concerns.

### Database & ORM

* PostgreSQL: A robust, ACID-compliant relational database.

* Prisma: Selected over TypeORM for its type-safety. Prisma generates a strictly typed client based on the schema,
  reducing runtime errors.

### Security

* JWE (JSON Web Encryption): Instead of standard JWTs (which are only signed), we use JWE (jose library) with A256GCM
  encryption. This ensures the token payload (containing User ID and Role) is opaque and unreadable to the client,
  preventing information leakage.

* Bcrypt: For secure password hashing.

### Authorization (The Core Logic)

* CASL: Used to implement ABAC. It decouples permission logic from business logic. This allows for complex rules.

* Custom Interceptors: Used for Attribute-Based Filtering. We implemented a custom *RoleSerializerInterceptor* that
  dynamically filters response fields based on the requestor's role and ownership of the data.

### Infrastructure

* Docker & Docker Compose: Ensures the entire environment (App + DB) is reproducible and runs with a single command.

* Makefile: Provides simple shortcuts for common tasks.

## Quick Start

### Prerequisites

* Docker & Docker Compose

* Node.js (for local development/testing)

* Running the App

The easiest way to start is using the included Makefile or npm script:

#### Option 1: Using Make

`make up`

#### Option 2: Using npm

`npm run docker:up`

The API will be available at: http://localhost:3000

Stopping the App

`make down`

#### or

`npm run docker:down`

## Documentation

#### Swagger UI

Interactive API documentation is automatically generated and available at:
http://localhost:3000/api

#### Postman

A Postman collection (abac_challenge.postman_collection.json) is included in the root directory. It contains
pre-configured requests with scripts to automatically handle token management.

## Testing

The project includes a comprehensive E2E test suite that validates all authorization constraints.

To run the tests inside the container (recommended):

`make test`

To run tests locally:

`npm run test:e2e`

## Security Features Implemented

* Strict Typing: The codebase forbids any and uses strict interfaces (AuthenticatedRequest, AuthUser) to prevent
type-related bugs.

* Data Integrity: Entities use strict constructors to prevent mass-assignment vulnerabilities. Database models are never
returned directly to the client.

* ACID Transactions: User registration creates both a User record and an AuditLog entry atomically. If one fails, both
roll back.

* PII Protection: Sensitive fields like nationalId and salary are protected by serialization groups and are never exposed
to unauthorized roles.

## Project Structure
```
src/
├── auth/ # Authentication (Login, Register, JWE)
├── casl/ # Authorization Rules (Permissions Factory)
├── common/ # Shared utilities (Logger, Interceptors)
├── config/ # Environment configuration
├── documents/ # Resource Module (Ownership Logic)
├── prisma/ # Database Connection
├── users/ # User Management & Attribute Filtering
└── main.ts # Entry point
```