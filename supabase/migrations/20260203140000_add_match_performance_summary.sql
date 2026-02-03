-- Add performance_summary column to matches table for AI insights
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS performance_summary JSONB DEFAULT NULL;

COMMENT ON COLUMN matches.performance_summary IS 'AI-generated JSON containing macroControl (0-100), microErrorRate (LOW/MED/HIGH), and reasoning';
