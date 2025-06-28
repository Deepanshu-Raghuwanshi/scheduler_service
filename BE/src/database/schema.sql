-- Create jobs table with optimized data types and indexes
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  job_type VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  payload JSONB DEFAULT '{}',
  
  -- Timing fields with proper indexing
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
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  CONSTRAINT valid_cron_expression CHECK (cron_expression ~ '^(\*|[0-5]?[0-9]|\*\/[0-9]+) (\*|[01]?[0-9]|2[0-3]|\*\/[0-9]+) (\*|[12]?[0-9]|3[01]|\*\/[0-9]+) (\*|[01]?[0-9]|1[0-2]|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$'),
  CONSTRAINT positive_runs CHECK (total_runs >= 0 AND successful_runs >= 0 AND failed_runs >= 0),
  CONSTRAINT valid_timeout CHECK (timeout_ms > 0),
  CONSTRAINT valid_retries CHECK (max_retries >= 0)
);

CREATE TABLE IF NOT EXISTS job_executions (
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

-- Create monthly partitions for job_executions (for the next 12 months)
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'job_executions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE 'CREATE TABLE IF NOT EXISTS ' || partition_name || 
                ' PARTITION OF job_executions FOR VALUES FROM (''' || start_date || ''') TO (''' || end_date || ''')';
    END LOOP;
END $$;

-- Optimized indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_next_run_active ON jobs (next_run_at, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_name ON jobs (name);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON jobs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_jobs_payload ON jobs USING GIN (payload);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions (job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions (status);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON job_executions (started_at);

-- Create function to update next_run_at based on cron expression
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, from_time TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- This is a simplified version. In production, you'd use a proper cron library
    -- For now, we'll handle basic cases
    CASE 
        WHEN cron_expr = '0 * * * *' THEN -- Every hour
            next_run := DATE_TRUNC('hour', from_time) + INTERVAL '1 hour';
        WHEN cron_expr = '0 0 * * *' THEN -- Daily at midnight
            next_run := DATE_TRUNC('day', from_time) + INTERVAL '1 day';
        WHEN cron_expr = '0 0 * * 1' THEN -- Weekly on Monday
            next_run := DATE_TRUNC('week', from_time) + INTERVAL '1 week';
        WHEN cron_expr = '0 0 1 * *' THEN -- Monthly on 1st
            next_run := DATE_TRUNC('month', from_time) + INTERVAL '1 month';
        ELSE
            -- Default to 1 hour for unknown patterns
            next_run := from_time + INTERVAL '1 hour';
    END CASE;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update next_run_at when cron_expression changes
CREATE OR REPLACE FUNCTION update_next_run_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.cron_expression != NEW.cron_expression) THEN
        NEW.next_run_at := calculate_next_run(NEW.cron_expression);
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_update_next_run ON jobs;
CREATE TRIGGER jobs_update_next_run
    BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_next_run_trigger();

-- Function to clean old job executions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_executions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM job_executions 
    WHERE started_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;