# Job Scheduler Service - Scaling Strategy Document

## Executive Summary

This document outlines comprehensive scaling strategies for the Job Scheduler Service, a Node.js-based microservice with PostgreSQL backend. The service currently handles job scheduling, execution tracking, and provides a React-based dashboard. As demand grows, implementing proper scaling strategies will ensure high availability, performance, and reliability.

## Current Architecture Analysis

### Service Components

- **Backend API**: Express.js with Node.js runtime
- **Database**: PostgreSQL with partitioned tables
- **Caching**: In-memory cache service
- **Scheduler**: node-cron based job execution
- **Frontend**: React dashboard with real-time updates

### Current Limitations

- Single instance deployment
- In-memory caching (not distributed)
- Single database connection
- No load balancing
- Limited horizontal scaling capabilities

## Scaling Strategies

### 1. Horizontal Scaling with Load Balancing

#### Implementation Approach

```yaml
# docker-compose.yml example
version: "3.8"
services:
  scheduler-api-1:
    build: ./BE
    environment:
      - NODE_ID=node-1
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  scheduler-api-2:
    build: ./BE
    environment:
      - NODE_ID=node-2
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - scheduler-api-1
      - scheduler-api-2
```

#### Load Balancer Configuration

- **NGINX/HAProxy**: Distribute requests across multiple service instances
- **Health Checks**: Utilize existing `/health` endpoint for instance monitoring
- **Session Affinity**: Not required due to stateless API design
- **SSL Termination**: Handle HTTPS at load balancer level

#### Benefits

- **Fault Tolerance**: Service continues if one instance fails
- **Increased Throughput**: Multiple instances handle concurrent requests
- **Zero-Downtime Deployments**: Rolling updates possible

### 2. Database Scaling Strategies

#### Read Replicas Implementation

```javascript
// Enhanced database connection with read/write splitting
class DatabaseConnection {
  constructor() {
    this.writePool = new Pool({
      connectionString: process.env.DB_WRITE_CONNECTION_STRING,
      max: 20,
    });

    this.readPools = [
      new Pool({
        connectionString: process.env.DB_READ_REPLICA_1,
        max: 15,
      }),
      new Pool({
        connectionString: process.env.DB_READ_REPLICA_2,
        max: 15,
      }),
    ];
  }

  async query(text, params, useWrite = false) {
    const pool = useWrite ? this.writePool : this.getReadPool();
    return await pool.query(text, params);
  }

  getReadPool() {
    // Round-robin or least-connections algorithm
    return this.readPools[Math.floor(Math.random() * this.readPools.length)];
  }
}
```

#### Database Sharding Strategy

```sql
-- Shard jobs by hash of job_id
CREATE TABLE jobs_shard_1 (LIKE jobs INCLUDING ALL);
CREATE TABLE jobs_shard_2 (LIKE jobs INCLUDING ALL);
CREATE TABLE jobs_shard_3 (LIKE jobs INCLUDING ALL);

-- Partition function
CREATE OR REPLACE FUNCTION get_shard_id(job_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (hashtext(job_uuid::text) % 3) + 1;
END;
$$ LANGUAGE plpgsql;
```

#### Connection Pooling Optimization

- **PgBouncer**: Implement connection pooling at database level
- **Pool Size Tuning**: Optimize based on concurrent load
- **Connection Monitoring**: Track pool utilization and performance

### 3. Distributed Caching with Redis

#### Redis Cluster Implementation

```javascript
// Enhanced cache service with Redis
const Redis = require("ioredis");

class DistributedCacheService {
  constructor() {
    this.redis = new Redis.Cluster(
      [
        { host: "redis-node-1", port: 6379 },
        { host: "redis-node-2", port: 6379 },
        { host: "redis-node-3", port: 6379 },
      ],
      {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
        },
      }
    );
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### Caching Strategies

- **Job Data**: Cache frequently accessed job configurations
- **Execution History**: Cache recent execution results
- **Statistics**: Cache dashboard statistics with short TTL
- **Rate Limiting**: Distributed rate limiting across instances

### 4. Service Replication and High Availability

#### Multi-Instance Scheduler Coordination

```javascript
// Distributed scheduler with leader election
class DistributedSchedulerService {
  constructor() {
    this.nodeId = process.env.NODE_ID || require("os").hostname();
    this.isLeader = false;
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async start() {
    // Implement leader election using Redis
    await this.electLeader();

    if (this.isLeader) {
      console.log(`Node ${this.nodeId} elected as scheduler leader`);
      await this.startScheduling();
    } else {
      console.log(`Node ${this.nodeId} running as follower`);
      await this.startFollowerMode();
    }
  }

  async electLeader() {
    const leaderKey = "scheduler:leader";
    const result = await this.redis.set(
      leaderKey,
      this.nodeId,
      "PX",
      30000, // 30 second TTL
      "NX" // Only set if not exists
    );

    this.isLeader = result === "OK";

    // Renew leadership periodically
    if (this.isLeader) {
      this.leadershipRenewal = setInterval(async () => {
        await this.redis.pexpire(leaderKey, 30000);
      }, 15000);
    }
  }
}
```

#### Health Check Enhancement

```javascript
// Enhanced health check for distributed environment
app.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    nodeId: process.env.NODE_ID,
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      scheduler: await checkSchedulerHealth(),
      dependencies: await checkExternalDependencies(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: await getCPUUsage(),
      activeConnections: getActiveConnections(),
    },
  };

  const isHealthy = Object.values(health.services).every(
    (service) => service.status === "up"
  );

  res.status(isHealthy ? 200 : 503).json(health);
});
```

### 5. API Management and Gateway

#### API Gateway Implementation

```yaml
# Kong/Ambassador configuration example
apiVersion: v1
kind: Service
metadata:
  name: scheduler-service
spec:
  selector:
    app: scheduler-api
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: scheduler-ingress
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  rules:
    - host: scheduler-api.company.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: scheduler-service
                port:
                  number: 3000
```

#### Rate Limiting at Gateway Level

- **Global Rate Limits**: Protect against DDoS attacks
- **Per-Client Limits**: Prevent individual client abuse
- **Endpoint-Specific Limits**: Different limits for different operations
- **Burst Handling**: Allow temporary spikes within limits

### 6. Monitoring and Observability

#### Metrics Collection

```javascript
// Prometheus metrics integration
const prometheus = require("prom-client");

const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

const jobExecutionCounter = new prometheus.Counter({
  name: "job_executions_total",
  help: "Total number of job executions",
  labelNames: ["job_type", "status"],
});

const activeJobsGauge = new prometheus.Gauge({
  name: "active_jobs_count",
  help: "Number of currently active jobs",
});
```

#### Distributed Tracing

- **Jaeger/Zipkin**: Trace requests across service instances
- **Correlation IDs**: Track requests through the entire system
- **Performance Monitoring**: Identify bottlenecks and slow operations

### 7. Auto-Scaling Configuration

#### Kubernetes HPA Example

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: scheduler-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: scheduler-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

1. Implement Redis for distributed caching
2. Set up database read replicas
3. Enhance health checks for load balancer compatibility
4. Add comprehensive monitoring and metrics

### Phase 2: Horizontal Scaling (Weeks 3-4)

1. Deploy multiple service instances
2. Implement load balancer with health checks
3. Set up distributed scheduler coordination
4. Test failover scenarios

### Phase 3: Advanced Scaling (Weeks 5-6)

1. Implement database sharding if needed
2. Set up API gateway with advanced rate limiting
3. Deploy auto-scaling configuration
4. Implement distributed tracing

### Phase 4: Optimization (Weeks 7-8)

1. Performance tuning and optimization
2. Capacity planning and load testing
3. Documentation and runbook creation
4. Team training and knowledge transfer

## Performance Targets

- **Throughput**: Handle 10,000+ requests per minute
- **Latency**: 95th percentile response time < 200ms
- **Availability**: 99.9% uptime with proper failover
- **Scalability**: Auto-scale from 2 to 20 instances based on load
- **Recovery**: < 30 seconds failover time for instance failures

## Cost Considerations

- **Infrastructure**: Estimated 3-5x increase in hosting costs
- **Operational**: Additional monitoring and management overhead
- **Development**: Initial implementation effort of 6-8 weeks
- **ROI**: Improved reliability and performance justify increased costs

## Conclusion

This scaling strategy provides a comprehensive approach to handle increased load while maintaining service reliability and performance. The phased implementation approach allows for gradual scaling while minimizing risks and ensuring system stability throughout the process.
