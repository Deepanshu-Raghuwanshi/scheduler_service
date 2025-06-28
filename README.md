# Job Scheduler Service

A comprehensive job scheduling microservice built with Node.js and React, featuring a robust backend API and an intuitive frontend dashboard for managing scheduled tasks.

## 🏗️ Architecture Overview

```
scheduler_service/
├── BE/                 # Backend API (Node.js + Express)
├── FE/                 # Frontend Dashboard (React + Vite)
└── README.md          # This file
```

## 🚀 Tech Stack

### Backend (BE/)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with Supabase)
- **Scheduler**: node-cron
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

### Frontend (FE/)

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Notifications**: React Toastify

## 📋 Features

### Core Functionality

- ✅ **Job Management**: Create, read, update, delete scheduled jobs
- ✅ **Multiple Job Types**: Scheduled, immediate, recurring, delayed
- ✅ **Cron Expression Support**: Full cron syntax with validation
- ✅ **Real-time Monitoring**: Live job execution tracking
- ✅ **Bulk Operations**: Manage multiple jobs simultaneously
- ✅ **Advanced Filtering**: Search and filter jobs by various criteria
- ✅ **Execution History**: Detailed logs of job runs
- ✅ **Error Handling**: Comprehensive error tracking and retry mechanisms

### Technical Features

- 🔒 **Security**: JWT authentication, rate limiting, input validation
- 📊 **Monitoring**: Health checks, system statistics, performance metrics
- 🎯 **Scalability**: Optimized database queries, pagination, partitioning
- 📱 **Responsive UI**: Mobile-friendly dashboard
- 🔄 **Real-time Updates**: Live status updates and notifications
- 📚 **API Documentation**: Interactive Swagger documentation

## 🛠️ Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone https://github.com/Deepanshu-Raghuwanshi/scheduler_service.git
cd scheduler_service
```

### 2. Backend Setup

```bash
cd BE
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### 3. Frontend Setup

```bash
cd FE/frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### 4. Database Setup

The backend will automatically create the required tables and indexes on startup. Ensure your PostgreSQL database is running and accessible.

## 🌐 API Endpoints

### Job Management

- `GET /api/jobs` - List all jobs with filtering and pagination
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job
- `POST /api/jobs/:id/trigger` - Manually trigger a job

### Job Monitoring

- `GET /api/jobs/stats` - Get job statistics
- `GET /api/jobs/:id/executions` - Get job execution history
- `POST /api/jobs/bulk` - Perform bulk operations

### System

- `GET /health` - Health check endpoint
- `GET /api/stats/system` - System statistics
- `GET /api-docs` - Interactive API documentation

## 🔧 Environment Configuration

### Backend Environment Variables

```env
# Database
DB_CONNECTION_STRING=postgresql://user:password@host:port/database

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key

# Timezone
TIMEZONE=Asia/Kolkata

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
```

## 📊 Database Schema

### Jobs Table

- **Primary Key**: UUID
- **Scheduling**: Cron expressions with timezone support
- **Metadata**: Tags, payload, execution statistics
- **Configuration**: Timeout, retries, delays

### Job Executions Table

- **Partitioned**: Monthly partitions for performance
- **Tracking**: Status, duration, error messages
- **Retention**: Automatic cleanup of old records

## 🚀 Deployment

### Development

```bash
# Backend
cd BE && npm run dev

# Frontend
cd FE/frontend && npm run dev
```

### Production

```bash
# Backend
cd BE && npm start

# Frontend
cd FE/frontend && npm run build && npm run preview
```

## 📈 Monitoring & Health Checks

### Health Check Endpoint

- **URL**: `GET /health`
- **Monitors**: Database connectivity, scheduler status, memory usage
- **Response**: Detailed health information with status codes

### System Statistics

- **URL**: `GET /api/stats/system`
- **Includes**: Uptime, memory usage, scheduler statistics, rate limiting stats

## 🔐 Security Features

- **Rate Limiting**: Different limits for various endpoints
- **Input Validation**: Comprehensive request validation using Joi
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS policies
- **Request Timeout**: Prevents hanging requests
- **Error Handling**: Secure error responses without sensitive data exposure

## 🧪 Testing

```bash
# Backend tests
cd BE && npm test

# Frontend tests
cd FE/frontend && npm test
```

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` when backend is running
- **Frontend Components**: See `FE/README.md`
- **Backend Architecture**: See `BE/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation at `/api-docs`
- Review the health check endpoint at `/health`
- Check individual README files in `BE/` and `FE/` directories

## 🔄 Version History

- **v1.0.0**: Initial release with core scheduling functionality
- **v1.1.0**: Added bulk operations and advanced filtering
- **v1.2.0**: Enhanced monitoring and health checks
