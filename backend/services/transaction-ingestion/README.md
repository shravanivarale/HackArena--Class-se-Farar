# Transaction Ingestion Service

Handles receiving, normalizing, categorizing, and publishing transaction events for the VitalScore Finance platform.

## Endpoints

- `POST /transactions/connections`: Setup bank connections (Razorpay)
- `GET /transactions/connections/:userId`: Retrieve user's connected external sources
- `POST /transactions/manual`: Manually input a cash transaction
- `GET /transactions/:userId`: Fetch paginated transaction history
- `PATCH /transactions/:txnId/category`: Override categorization of a transaction

## Normalization Pipeline
1. ID deduplication hashing
2. PII Tokenization
3. ML and Rule-based layered categorization
4. Event publish to AWS SQS

## Environment Variables
- `PORT`: Service port (default 3003)
- `AWS_REGION`: AWS region for SQS
- `SQS_ENDPOINT`: SQS endpoint override (useful for Localstack)
- `TRANSACTION_QUEUE_URL`: Target queue URL for publishing transaction events
