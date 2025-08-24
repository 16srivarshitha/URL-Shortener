CREATE INDEX IF NOT EXISTS idx_urls_active ON urls(short_code) 
WHERE deleted_at IS NULL AND (expiration_date IS NULL OR expiration_date > CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_analytics_recent ON analytics(short_code, clicked_at DESC) 
WHERE clicked_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Partial index for non-expired URLs
CREATE INDEX IF NOT EXISTS idx_urls_non_expired ON urls(short_code, original_url) 
WHERE deleted_at IS NULL AND (expiration_date IS NULL OR expiration_date > CURRENT_TIMESTAMP);