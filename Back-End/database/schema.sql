-- SAMPURNA Smart Waste Management Database Schema
-- Database tables for IoT waste monitoring system

-- Table: trash_bins
-- Stores information about physical trash bins and their current status
CREATE TABLE IF NOT EXISTS trash_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity_percentage INTEGER CHECK (capacity_percentage >= 0 AND capacity_percentage <= 100),
  status VARCHAR(20) CHECK (status IN ('normal', 'warning', 'critical', 'offline')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  device_id VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: iot_devices
-- Stores ESP32 sensor device information and configurations
CREATE TABLE IF NOT EXISTS iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(255) NOT NULL,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  network_status VARCHAR(20) CHECK (network_status IN ('online', 'offline')),
  threshold_limit INTEGER DEFAULT 80 CHECK (threshold_limit >= 0 AND threshold_limit <= 100),
  firmware_version VARCHAR(20) DEFAULT 'v2.3.1',
  ip_address VARCHAR(45),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: capacity_history
-- Stores historical capacity readings for analytics
CREATE TABLE IF NOT EXISTS capacity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id VARCHAR(50) NOT NULL,
  capacity_percentage INTEGER CHECK (capacity_percentage >= 0 AND capacity_percentage <= 100),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  device_id VARCHAR(50),
  FOREIGN KEY (device_id) REFERENCES iot_devices(device_id) ON DELETE SET NULL
);

-- Table: alerts
-- Stores alert notifications when bins reach threshold
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id VARCHAR(50) NOT NULL,
  alert_type VARCHAR(20) CHECK (alert_type IN ('warning', 'critical', 'offline')),
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trash_bins_status ON trash_bins(status);
CREATE INDEX IF NOT EXISTS idx_trash_bins_last_updated ON trash_bins(last_updated);
CREATE INDEX IF NOT EXISTS idx_iot_devices_network_status ON iot_devices(network_status);
CREATE INDEX IF NOT EXISTS idx_capacity_history_bin_id ON capacity_history(bin_id);
CREATE INDEX IF NOT EXISTS idx_capacity_history_recorded_at ON capacity_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_trash_bins_updated_at
  BEFORE UPDATE ON trash_bins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iot_devices_updated_at
  BEFORE UPDATE ON iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE trash_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access on trash_bins"
  ON trash_bins FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on iot_devices"
  ON iot_devices FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on capacity_history"
  ON capacity_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on alerts"
  ON alerts FOR SELECT
  USING (true);

-- Insert/Update/Delete policies (authenticated users only)
CREATE POLICY "Allow authenticated insert on trash_bins"
  ON trash_bins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on trash_bins"
  ON trash_bins FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete on trash_bins"
  ON trash_bins FOR DELETE
  USING (true);

CREATE POLICY "Allow authenticated insert on iot_devices"
  ON iot_devices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on iot_devices"
  ON iot_devices FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete on iot_devices"
  ON iot_devices FOR DELETE
  USING (true);
