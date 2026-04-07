# Deployment & Scaling Guide - Ethereal Platform

## Overview

This guide covers deployment strategies from local development to production-scale infrastructure.

---

## Deployment Phases

### Phase 1: Local Development

**Environment**: Docker Compose on developer machine

**Components**:
- PostgreSQL + pgvector
- Redis
- NestJS API (hot reload)
- FastAPI AI service (hot reload)
- Next.js web (hot reload)
- React Native (Expo dev)

**Setup**:
```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start all services
npm run dev
```

**Access**:
- API: http://localhost:3001
- Web: http://localhost:3000
- AI Service: http://localhost:8000
- Docs: http://localhost:3001/api/docs

---

### Phase 2: Staging Environment

**Recommended Platform**: Railway.app or Render.com (Cost-effective)

**Why Railway/Render**:
- Simple deployment from Git
- Automatic HTTPS
- Environment variable management
- Database included
- ~$50-100/month for full stack

#### Railway Deployment

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Services to Deploy**:
1. PostgreSQL (Railway managed database)
2. Redis (Railway template)
3. API Service (from apps/api)
4. AI Service (from apps/ai-service)
5. Web (Vercel recommended for Next.js)

**Environment Variables**:
```bash
# Copy from .env.example
# Set in Railway dashboard for each service
```

---

### Phase 3: Production (Cloud-Native)

#### Option A: AWS ECS + Fargate (Serverless Containers)

**Architecture**:
```
[CloudFront CDN]
       ↓
[ALB - Application Load Balancer]
       ↓
[ECS Fargate Services]
  ├── API Service (2+ containers)
  ├── AI Service (1+ containers, GPU-enabled)
  └── Web Service (2+ containers)
       ↓
[RDS PostgreSQL] [ElastiCache Redis]
       ↓
[S3 + CloudFront] (Media storage)
```

**Estimated Costs** (1,000 DAU):
- ECS Fargate: $100-150/month
- RDS PostgreSQL: $50-100/month
- ElastiCache: $20-40/month
- S3 + CloudFront: $20-50/month
- **Total**: $190-340/month + AI API costs

**Terraform Configuration**:

```hcl
# infrastructure/terraform/main.tf

provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "ethereal-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "ethereal-postgres"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t4g.medium"
  allocated_storage   = 100
  storage_encrypted   = true
  
  db_name  = "ethereal"
  username = "ethereal_admin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  skip_final_snapshot    = false
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ethereal-redis"
  engine              = "redis"
  node_type           = "cache.t4g.small"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  port                = 6379
  
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ethereal-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# API Service
resource "aws_ecs_task_definition" "api" {
  family                   = "ethereal-api"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "512"
  memory                  = "1024"
  
  container_definitions = jsonencode([{
    name  = "api"
    image = "${aws_ecr_repository.api.repository_url}:latest"
    
    portMappings = [{
      containerPort = 3001
      protocol      = "tcp"
    }]
    
    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "DATABASE_URL"
        value = "postgresql://${aws_db_instance.postgres.username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/ethereal-api"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
  
  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "ethereal-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3001
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ethereal-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets
}

# S3 for Media
resource "aws_s3_bucket" "media" {
  bucket = "ethereal-media-${var.environment}"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront CDN
resource "aws_cloudfront_distribution" "media" {
  enabled = true
  
  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.media.id}"
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

**Deploy Command**:
```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Build and push Docker images
./scripts/deploy-prod.sh
```

---

#### Option B: Google Cloud Platform (GKE)

**Architecture**:
```
[Cloud CDN + Load Balancer]
       ↓
[GKE Kubernetes Cluster]
  ├── API Deployment (3 replicas)
  ├── AI Service Deployment (2 replicas, GPU nodes)
  └── Web Deployment (3 replicas)
       ↓
[Cloud SQL PostgreSQL] [Memorystore Redis]
       ↓
[Cloud Storage] (Media)
```

**Kubernetes Manifests**:

```yaml
# infrastructure/k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ethereal-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ethereal-api
  template:
    metadata:
      labels:
        app: ethereal-api
    spec:
      containers:
      - name: api
        image: gcr.io/your-project/ethereal-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ethereal-api-service
spec:
  selector:
    app: ethereal-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

**Horizontal Pod Autoscaler**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ethereal-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ethereal-api
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

---

#### Option C: Vercel + Serverless (Hybrid)

**Best for**: Web-first approach with cost optimization

**Architecture**:
- **Web**: Vercel (Next.js native platform)
- **API**: Railway or Fly.io
- **AI Service**: Modal.com or Banana.dev (serverless GPU)
- **Database**: Supabase or Neon (serverless PostgreSQL)
- **Redis**: Upstash (serverless Redis)

**Advantages**:
- Pay-per-use for AI services
- Auto-scaling
- Simple deployment
- Low maintenance

**Disadvantages**:
- Cold starts for AI service
- Less control over infrastructure

---

## Database Migration Strategy

### Zero-Downtime Migrations

```typescript
// Use Prisma migration best practices

// 1. Add new column (nullable)
await prisma.$executeRaw`
  ALTER TABLE "User" 
  ADD COLUMN "new_field" TEXT;
`;

// 2. Backfill data
await prisma.user.updateMany({
  data: {
    newField: 'default_value',
  },
});

// 3. Make non-nullable if needed
await prisma.$executeRaw`
  ALTER TABLE "User" 
  ALTER COLUMN "new_field" SET NOT NULL;
`;

// 4. Create index without blocking
await prisma.$executeRaw`
  CREATE INDEX CONCURRENTLY idx_user_new_field 
  ON "User"(new_field);
`;
```

---

## Scaling Strategies

### Horizontal Scaling

**API Service**:
- Run 2+ instances behind load balancer
- Use sticky sessions for WebSocket
- Share session state via Redis

**AI Service**:
- Queue-based processing (BullMQ)
- Auto-scale workers based on queue depth
- GPU instances for image generation

**Database**:
- Read replicas for analytics
- Connection pooling (PgBouncer)
- Partitioning for large tables

### Vertical Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU | > 70% sustained | Add vCPUs or scale horizontally |
| Memory | > 80% | Increase RAM or optimize queries |
| DB Connections | > 80% of max | Add connection pooling |
| Queue Depth | > 1000 jobs | Add workers |
| API Latency | > 500ms p95 | Investigate bottlenecks |

---

## Monitoring & Observability

### Recommended Stack

**Metrics**: Prometheus + Grafana
**Logs**: Loki or CloudWatch
**Tracing**: Jaeger or DataDog APM
**Uptime**: UptimeRobot or Pingdom
**Error Tracking**: Sentry

### Critical Metrics to Monitor

```typescript
// Backend metrics
- api_request_duration_seconds (histogram)
- api_request_total (counter)
- websocket_connections_active (gauge)
- ai_generation_duration_seconds (histogram)
- database_query_duration_seconds (histogram)
- cache_hit_rate (gauge)
- credits_deducted_total (counter)

// Business metrics
- users_registered_total (counter)
- conversations_started_total (counter)
- messages_sent_total (counter)
- images_generated_total (counter)
- revenue_usd_total (counter)
```

### Health Checks

```typescript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
      () => this.checkExternalAPIs(),
    ]);
  }
}
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Automated daily backups
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"

# Dump database
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://ethereal-backups/

# Retain last 30 days
aws s3 ls s3://ethereal-backups/ | \
  head -n -30 | \
  awk '{print $4}' | \
  xargs -I {} aws s3 rm s3://ethereal-backups/{}
```

### Recovery Procedures

**Database Restoration**:
```bash
# Download backup
aws s3 cp s3://ethereal-backups/backup_20260405.sql.gz .

# Restore
gunzip < backup_20260405.sql.gz | psql $DATABASE_URL
```

**Service Recovery**:
1. Check service health endpoints
2. Review CloudWatch/Grafana logs
3. Roll back to previous deployment if needed
4. Notify users via status page

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
      
      - name: Build Docker image
        run: docker build -t ethereal-api:latest -f apps/api/Dockerfile .
      
      - name: Tag image
        run: docker tag ethereal-api:latest ${{ secrets.ECR_REGISTRY }}/ethereal-api:latest
      
      - name: Push to ECR
        run: docker push ${{ secrets.ECR_REGISTRY }}/ethereal-api:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster ethereal-cluster \
            --service ethereal-api \
            --force-new-deployment

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Cost Optimization

### Strategies

1. **Use Spot Instances** for AI workers (save 70%)
2. **Cache aggressively** with Redis
3. **Compress media** before storing
4. **Use CDN** for static assets
5. **Optimize database queries** and indexes
6. **Implement rate limiting** to prevent abuse
7. **Use serverless** for low-traffic services
8. **Monitor AI API costs** closely

### Budget Alerts

```typescript
// Set up cost alerts
- Alert when daily AI API costs > $50
- Alert when monthly infrastructure > $500
- Alert when storage growth > 50GB/week
```

---

## Security Checklist

- [ ] HTTPS everywhere (TLS 1.3)
- [ ] API rate limiting (100 req/min per user)
- [ ] JWT token rotation
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection (sanitize inputs)
- [ ] CORS properly configured
- [ ] Secrets in environment variables (never in code)
- [ ] API keys rotated monthly
- [ ] Database encrypted at rest
- [ ] Regular security audits
- [ ] DDoS protection (CloudFlare)
- [ ] Content moderation active
- [ ] User data privacy compliance (GDPR)

---

## Performance Targets - Production

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API Response Time (p95) | < 200ms | > 500ms |
| Text Generation (first token) | < 200ms | > 500ms |
| Image Generation | < 6s | > 10s |
| WebSocket Latency | < 50ms | > 100ms |
| Database Query Time (p95) | < 50ms | > 100ms |
| Uptime | > 99.9% | < 99.5% |

---

## Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Database backups automated
- [ ] Monitoring dashboards configured
- [ ] Error tracking (Sentry) integrated
- [ ] API documentation published
- [ ] Terms of Service and Privacy Policy published
- [ ] Support email configured
- [ ] Status page set up (status.ethereal.app)

### Launch Day
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Monitor API costs
- [ ] Announce launch
- [ ] Monitor user feedback

### Post-Launch
- [ ] Daily metrics review
- [ ] Weekly cost review
- [ ] Monthly security review
- [ ] User feedback implementation
- [ ] Performance optimization
- [ ] Scale based on growth

---

## Troubleshooting Guide

### High API Latency
1. Check database query performance
2. Review Redis cache hit rate
3. Check external AI API response times
4. Scale API instances if CPU > 70%

### WebSocket Disconnections
1. Check load balancer timeout settings
2. Review network stability
3. Implement reconnection logic
4. Add heartbeat/ping mechanism

### Database Connection Exhaustion
1. Implement connection pooling
2. Review long-running queries
3. Add query timeout limits
4. Scale database instance

### High AI API Costs
1. Review usage patterns
2. Implement aggressive caching
3. Add usage limits per user
4. Consider self-hosted models for popular use cases

---

This deployment guide provides a clear path from development to production-scale infrastructure.
