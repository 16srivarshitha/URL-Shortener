CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  browser VARCHAR(100),
  os VARCHAR(100),
  device VARCHAR(100),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (short_code) REFERENCES urls(short_code) ON DELETE CASCADE
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_short_code ON analytics(short_code);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at ON analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics(country);
CREATE INDEX IF NOT EXISTS idx_analytics_browser ON analytics(browser);
CREATE INDEX IF NOT EXISTS idx_analytics_composite ON analytics(short_code, clicked_at);