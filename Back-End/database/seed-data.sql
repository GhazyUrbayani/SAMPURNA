-- SAMPURNA Smart Waste Management - Seed Data
-- Sample data for testing and development

-- Insert IoT Devices
INSERT INTO iot_devices (device_id, location, battery_level, network_status, threshold_limit, firmware_version, ip_address, last_ping) VALUES
('ESP32-001', 'Labtek V', 67, 'online', 80, 'v2.3.1', '192.168.1.101', NOW() - INTERVAL '5 minutes'),
('ESP32-002', 'Labtek VIII', 94, 'online', 80, 'v2.3.1', '192.168.1.102', NOW() - INTERVAL '6 minutes'),
('ESP32-003', 'GKU Timur', 12, 'offline', 80, 'v2.2.8', '192.168.1.103', NOW() - INTERVAL '2 hours'),
('ESP32-004', 'GKU Barat', 76, 'online', 80, 'v2.3.1', '192.168.1.104', NOW() - INTERVAL '4 minutes'),
('ESP32-005', 'CC Timur', 89, 'online', 80, 'v2.3.0', '192.168.1.105', NOW() - INTERVAL '10 minutes'),
('ESP32-006', 'CC Barat', 70, 'online', 80, 'v2.3.1', '192.168.1.106', NOW() - INTERVAL '6 minutes'),
('ESP32-007', 'Oktagon', 85, 'online', 80, 'v2.3.1', '192.168.1.107', NOW() - INTERVAL '7 minutes'),
('ESP32-008', 'Sunken Court', 90, 'online', 80, 'v2.3.1', '192.168.1.108', NOW() - INTERVAL '9 minutes')
ON CONFLICT (device_id) DO NOTHING;

-- Insert Trash Bins
INSERT INTO trash_bins (bin_id, location, capacity_percentage, status, device_id, latitude, longitude, last_updated) VALUES
('BIN-001', 'Labtek V - Floor 1', 45, 'normal', 'ESP32-001', -6.890828, 107.610298, NOW() - INTERVAL '5 minutes'),
('BIN-002', 'Labtek VIII - Cafeteria', 92, 'critical', 'ESP32-002', -6.891234, 107.610567, NOW() - INTERVAL '3 minutes'),
('BIN-003', 'GKU Timur - Entrance', 23, 'offline', 'ESP32-003', -6.889567, 107.609876, NOW() - INTERVAL '2 hours'),
('BIN-004', 'GKU Barat - Lobby', 78, 'warning', 'ESP32-004', -6.889234, 107.609234, NOW() - INTERVAL '4 minutes'),
('BIN-005', 'CC Timur - Food Court', 85, 'critical', 'ESP32-005', -6.890456, 107.610789, NOW() - INTERVAL '10 minutes'),
('BIN-006', 'CC Barat - Main Hall', 34, 'normal', 'ESP32-006', -6.890123, 107.610234, NOW() - INTERVAL '6 minutes'),
('BIN-007', 'Oktagon - Center Area', 67, 'warning', 'ESP32-007', -6.890789, 107.610456, NOW() - INTERVAL '7 minutes'),
('BIN-008', 'Sunken Court - Garden', 12, 'normal', 'ESP32-008', -6.890345, 107.610678, NOW() - INTERVAL '9 minutes')
ON CONFLICT (bin_id) DO NOTHING;

-- Insert Historical Capacity Data (last 24 hours sample)
INSERT INTO capacity_history (bin_id, capacity_percentage, recorded_at, device_id)
SELECT
  'BIN-001',
  (RANDOM() * 50 + 20)::INTEGER,
  NOW() - (interval '1 hour' * generate_series),
  'ESP32-001'
FROM generate_series(0, 23);

INSERT INTO capacity_history (bin_id, capacity_percentage, recorded_at, device_id)
SELECT
  'BIN-002',
  (RANDOM() * 30 + 65)::INTEGER,
  NOW() - (interval '1 hour' * generate_series),
  'ESP32-002'
FROM generate_series(0, 23);

INSERT INTO capacity_history (bin_id, capacity_percentage, recorded_at, device_id)
SELECT
  'BIN-004',
  (RANDOM() * 40 + 40)::INTEGER,
  NOW() - (interval '1 hour' * generate_series),
  'ESP32-004'
FROM generate_series(0, 23);

-- Insert Active Alerts
INSERT INTO alerts (bin_id, alert_type, message, is_resolved, created_at) VALUES
('BIN-002', 'critical', 'Bin capacity at 92% - Requires immediate pickup', FALSE, NOW() - INTERVAL '3 minutes'),
('BIN-005', 'critical', 'Bin capacity at 85% - Requires immediate pickup', FALSE, NOW() - INTERVAL '5 minutes'),
('BIN-003', 'offline', 'Device ESP32-003 is offline for 2 hours', FALSE, NOW() - INTERVAL '2 hours'),
('BIN-004', 'warning', 'Bin capacity at 78% - Schedule pickup soon', FALSE, NOW() - INTERVAL '15 minutes');
