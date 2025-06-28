# Job Scheduler Backend API

A robust Node.js backend service for managing scheduled jobs with PostgreSQL database and comprehensive monitoring capabilities.

## 🏗️ Architecture

```
BE/
├── index.js                 # Main application entry point
├── package.json            # Dependencies and scripts
├── .env                    # Environment configuration
├── swagger-output.json     # Generated Swagger documentation
└── src/
    ├── controllers/        # Request handlers
    ├── database/          # Database connection and schema
    ├── middleware/        # Custom middleware functions
    ├── models/           # Data models and business logic
    ├── routes/           # API route definitions
    ├── services/         # Business services (scheduler, etc.)
    ├── utils/            # Utility functions and helpers
    └── validators/       # Input validation schemas
```

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with advanced features
- **ORM**: Native PostgreSQL client (pg)
- **Scheduler**: node-cron for job scheduling
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi for request validation
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Security**: Helmet, CORS, bcrypt
- **Performance**: Compression middleware, rate limiting

## 📦 Dependencies

### Production Dependencies

```json
{
  "bcrypt": "^5.1.1", // Password hashing
  "compression": "^1.8.0", // Response compression
  "cors": "^2.8.5", // Cross-origin resource sharing
  "dotenv": "^16.5.0", // Environment variables
  "express": "^5.1.0", // Web framework
  "helmet": "^8.1.0", // Security headers
  "joi": "^17.13.3", // Input validation
  "jsonwebtoken": "^9.0.2", // JWT authentication
  "node-cron": "^4.1.1", // Job scheduling
  "pg": "^8.15.6", // PostgreSQL client
  "swagger-jsdoc": "^6.2.8", // Swagger documentation
  "swagger-ui-express": "^5.0.1" // Swagger UI
}
```

### Development Dependencies

```json
{
  "nodemon": "^3.1.0" // Development server with auto-reload
}
```

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Deepanshu-Raghuwanshi/scheduler_service.git
cd scheduler_service
```

### 2. Install Dependencies

```bash
cd BE
npm install
```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_CONNECTION_STRING=postgresql://username:password@host:port/database

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key

# Timezone
TIMEZONE=Asia/Kolkata

# CORS (optional - comma-separated origins)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Database Setup

The application will automatically:

- Create required tables and indexes
- Set up database partitioning for job executions
- Initialize stored procedures and triggers

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🌐 API Endpoints

### Job Management

#### Get All Jobs

```http
GET /api/jobs?page=1&limit=10&search=backup&jobType=scheduled&isActive=true&tags=daily
```

**Query Parameters:**

- `page` (number): Page number for pagination
- `limit` (number): Items per page (max 100)
- `search` (string): Search in name and description
- `jobType` (string): Filter by job type (scheduled, immediate, recurring, delayed)
- `isActive` (boolean): Filter by active status
- `tags` (string): Comma-separated tags to filter by

#### Create Job

```http
POST /api/jobs
Content-Type: application/json

{
  "name": "Daily Data Backup",
  "description": "Backup user data every day at midnight",
  "cronExpression": "0 0 * * *",
  "isActive": true,
  "jobType": "scheduled",
  "payload": {
    "database": "users",
    "format": "json"
  },
  "timeoutMs": 30000,
  "maxRetries": 3,
  "retryDelayMs": 5000,
  "tags": ["backup", "daily"]
}
```

#### Get Job by ID

```http
GET /api/jobs/{id}
```

#### Update Job

```http
PUT /api/jobs/{id}
Content-Type: application/json

{
  "name": "Updated Job Name",
  "cronExpression": "0 2 * * *",
  "isActive": false
}
```

#### Delete Job

```http
DELETE /api/jobs/{id}
```

#### Trigger Job Manually

```http
POST /api/jobs/{id}/trigger
```

### Job Monitoring

#### Get Job Statistics

```http
GET /api/jobs/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalJobs": 25,
    "activeJobs": 18,
    "inactiveJobs": 7,
    "jobsByType": {
      "scheduled": 15,
      "immediate": 5,
      "recurring": 3,
      "delayed": 2
    },
    "executionStats": {
      "totalExecutions": 1250,
      "successfulExecutions": 1180,
      "failedExecutions": 70
    }
  }
}
```

#### Get Job Execution History

```http
GET /api/jobs/{id}/executions?page=1&limit=20&status=completed
```

#### Bulk Operations

```http
POST /api/jobs/bulk
Content-Type: application/json

{
  "jobIds": ["uuid1", "uuid2", "uuid3"],
  "operation": "activate" // or "deactivate", "delete", "trigger"
}
```

### System Endpoints

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "up",
      "latency": 15
    },
    "scheduler": {
      "status": "running",
      "activeJobs": 18,
      "runningExecutions": 3
    }
  },
  "memory": {
    "rss": 45678592,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  }
}
```

#### System Statistics

```http
GET /api/stats/system
```

#### API Documentation

```http
GET /api-docs
```

## 🗄️ Database Schema

### Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  job_type VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  payload JSONB DEFAULT '{}',

  -- Timing fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Execution tracking
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  -- Configuration
  timeout_ms INTEGER DEFAULT 30000,
  max_retries INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 5000,

  -- Metadata
  created_by VARCHAR(255),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

### Job Executions Table (Partitioned)

```sql
CREATE TABLE job_executions (
  id UUID DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  output JSONB DEFAULT '{}',
  PRIMARY KEY (id, started_at)
) PARTITION BY RANGE (started_at);
```

### Key Features

- **UUID Primary Keys**: For better distribution and security
- **JSONB Support**: Flexible payload and output storage
- **Partitioning**: Monthly partitions for job_executions table
- **Indexes**: Optimized for common query patterns
- **Constraints**: Data integrity validation
- **Triggers**: Automatic next_run_at calculation

## 🔧 Configuration

### Environment Variables

| Variable               | Description                  | Default      | Required |
| ---------------------- | ---------------------------- | ------------ | -------- |
| `DB_CONNECTION_STRING` | PostgreSQL connection string | -            | ✅       |
| `PORT`                 | Server port                  | 3000         | ❌       |
| `NODE_ENV`             | Environment mode             | development  | ❌       |
| `JWT_SECRET`           | JWT signing secret           | -            | ✅       |
| `TIMEZONE`             | Default timezone             | Asia/Kolkata | ❌       |
| `ALLOWED_ORIGINS`      | CORS allowed origins         | \*           | ❌       |

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Job Trigger**: 10 requests per minute (stricter)
- **Health Check**: No rate limiting

### Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies
- **Input Validation**: Joi schemas for all endpoints
- **Request Timeout**: 30-second timeout for all requests
- **Error Handling**: Secure error responses

## 🔄 Scheduler Service

### Features

- **Cron Expression Support**: Full cron syntax
- **Timezone Handling**: IST (Asia/Kolkata) support
- **Automatic Recovery**: Restart failed jobs
- **Execution Tracking**: Detailed execution logs
- **Performance Monitoring**: Real-time statistics

### Supported Cron Patterns

```javascript
"0 * * * *"; // Every hour
"0 0 * * *"; // Daily at midnight
"0 9 * * *"; // Daily at 9 AM
"0 0 * * 1"; // Weekly on Monday
"0 0 1 * *"; // Monthly on 1st
"*/15 * * * *"; // Every 15 minutes
```

## 📊 Monitoring & Logging

### Health Monitoring

- Database connectivity checks
- Scheduler status monitoring
- Memory usage tracking
- Response time monitoring

### Logging

- Request/response logging
- Error logging with stack traces
- Performance metrics
- Scheduler execution logs

### Metrics Available

- Active job count
- Execution success/failure rates
- Average execution duration
- Memory usage statistics
- Rate limiting statistics

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "job controller"
```

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
# Set NODE_ENV=production
npm start
```

### Docker (if needed)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Maintenance

### Database Cleanup

The system includes automatic cleanup functions:

```sql
-- Clean old job executions (older than 30 days)
SELECT cleanup_old_executions(30);
```

### Monitoring Queries

```sql
-- Check job execution statistics
SELECT
  j.name,
  j.total_runs,
  j.successful_runs,
  j.failed_runs,
  j.last_run_at,
  j.next_run_at
FROM jobs j
WHERE j.is_active = true;

-- Check recent executions
SELECT
  je.job_id,
  j.name,
  je.status,
  je.started_at,
  je.duration_ms
FROM job_executions je
JOIN jobs j ON je.job_id = j.id
WHERE je.started_at > NOW() - INTERVAL '1 day'
ORDER BY je.started_at DESC;
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check `DB_CONNECTION_STRING` format
   - Verify database server is running
   - Check network connectivity

2. **Jobs Not Executing**

   - Check scheduler status at `/health`
   - Verify cron expressions are valid
   - Check job `is_active` status

3. **High Memory Usage**
   - Monitor job execution history cleanup
   - Check for memory leaks in job payloads
   - Review partition maintenance

### Debug Mode

Set `NODE_ENV=development` for detailed logging and error messages.

## 📚 API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. This includes:

- Complete endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication examples

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper JSDoc comments
3. Include input validation for new endpoints
4. Update Swagger documentation
5. Add appropriate error handling
6. Test with various edge cases

## 📄 License

This project is licensed under the MIT License.
