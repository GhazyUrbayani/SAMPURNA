# SAMPURNA Back-End

Backend infrastructure untuk SAMPURNA Smart Waste Management System.

## 📁 Struktur Folder

```
Back-End/
├── database/           # Database schema dan seed data
│   ├── schema.sql     # PostgreSQL table definitions
│   └── seed-data.sql  # Sample data untuk testing
│
├── api/               # API clients dan konfigurasi
│   └── supabase-client.ts  # Supabase client setup
│
├── services/          # Business logic services
│   ├── bins.service.ts      # Trash bins operations
│   ├── devices.service.ts   # IoT devices management
│   └── analytics.service.ts # Analytics dan reporting
│
└── types/             # TypeScript type definitions
    └── database.types.ts    # Database schema types
```

## 🗄️ Database Schema

### Tables:

1. **trash_bins** - Informasi tempat sampah dan status real-time
   - bin_id, location, capacity_percentage, status
   - latitude/longitude untuk mapping
   - Foreign key ke iot_devices

2. **iot_devices** - ESP32 sensor devices
   - device_id, location, battery_level
   - network_status, firmware_version
   - threshold_limit untuk alert

3. **capacity_history** - Historical capacity readings
   - Untuk analytics dan trend visualization
   - Time-series data dengan timestamp

4. **alerts** - Alert notifications
   - warning, critical, offline alerts
   - is_resolved status tracking

## 🚀 Setup Instructions

### 1. Install Supabase Client

```bash
pnpm add @supabase/supabase-js
```

### 2. Konfigurasi Supabase

1. Buka Supabase Dashboard: https://app.supabase.com
2. Buat project baru atau pilih existing project
3. Copy **URL** dan **anon key** dari Settings > API
4. Update `Back-End/api/supabase-client.ts`:

```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 3. Setup Database

1. Di Supabase Dashboard, buka **SQL Editor**
2. Copy paste isi `database/schema.sql` dan run
3. Copy paste isi `database/seed-data.sql` dan run

### 4. Enable Row Level Security (RLS)

Schema sudah include RLS policies untuk:
- Public read access (SELECT)
- Authenticated users untuk INSERT/UPDATE/DELETE

### 5. (Optional) Setup Realtime

Di Supabase Dashboard:
1. Buka **Database** > **Replication**
2. Enable replication untuk tables: `trash_bins`, `iot_devices`

## 📝 Usage Examples

### Bins Service

```typescript
import { getAllBins, updateBinCapacity } from './services/bins.service';

// Fetch all bins
const bins = await getAllBins();

// Update bin capacity (auto-calculates status)
const updated = await updateBinCapacity('BIN-001', 85);

// Subscribe to real-time updates
const subscription = subscribeToBinUpdates((bin) => {
  console.log('Bin updated:', bin);
});
```

### Devices Service

```typescript
import { registerDevice, updateDevicePing } from './services/devices.service';

// Register new ESP32 device
const device = await registerDevice({
  device_id: 'ESP32-009',
  location: 'Labtek IX - Floor 3',
  battery_level: 100,
  network_status: 'online',
  threshold_limit: 80,
});

// Update device ping (heartbeat)
await updateDevicePing('ESP32-001');
```

### Analytics Service

```typescript
import { getBinCapacityHistory, getActiveAlerts } from './services/analytics.service';

// Get 24h history for charts
const history = await getBinCapacityHistory('BIN-001', 24);

// Get unresolved alerts
const alerts = await getActiveAlerts();
```

## 🔐 Security Notes

- RLS policies sudah enabled untuk semua tables
- Public read access (SELECT) allowed
- Write operations memerlukan authentication
- Jangan commit credentials ke git
- Use environment variables untuk production

## 🧪 Testing Backend

### Test Supabase Connection:

```typescript
import { testSupabaseConnection } from './api/supabase-client';

// Test connection
const isConnected = await testSupabaseConnection();
console.log('Connected:', isConnected);
```

### Test dengan cURL:

```bash
curl -X GET 'YOUR_SUPABASE_URL/rest/v1/trash_bins?select=*' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 📊 Database Indexes

Schema includes optimized indexes untuk:
- Status filtering (`idx_trash_bins_status`)
- Time-based queries (`idx_capacity_history_recorded_at`)
- Alert filtering (`idx_alerts_is_resolved`)

## 🔄 Auto-Updates

Database includes triggers untuk:
- Auto-update `updated_at` timestamps
- Timestamp tracking pada INSERT/UPDATE

## 📱 Integration dengan Frontend

Import services di React components:

```typescript
import { getAllBins } from '../Back-End/services/bins.service';

useEffect(() => {
  async function loadBins() {
    const data = await getAllBins();
    setBins(data);
  }
  loadBins();
}, []);
```

## 🚨 Common Issues

1. **"Missing authorization header"**
   - Pastikan SUPABASE_ANON_KEY sudah diset dengan benar

2. **RLS policy errors**
   - Check RLS policies di Supabase Dashboard
   - Pastikan authentication jika diperlukan

3. **CORS errors**
   - Add domain ke Supabase allowed origins
   - Check Supabase Dashboard > Settings > API

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
