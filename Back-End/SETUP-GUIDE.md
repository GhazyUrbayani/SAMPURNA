# 🚀 SAMPURNA Backend Setup Guide

Panduan lengkap setup backend Supabase untuk SAMPURNA Dashboard.

## 📋 Prerequisites

- [x] Account Supabase (gratis di [supabase.com](https://supabase.com))
- [x] Node.js & pnpm installed
- [x] @supabase/supabase-js package (sudah terinstall)

## 🔧 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Isi form:
   - **Name**: SAMPURNA-IoT-Dashboard
   - **Database Password**: [pilih password yang kuat]
   - **Region**: Southeast Asia (Singapore) - untuk latency terbaik
4. Click **"Create new project"**
5. Tunggu ~2 menit sampai project ready

### Step 2: Get API Credentials

1. Di Supabase Dashboard, buka **Settings** (⚙️) > **API**
2. Copy credentials berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...` (key panjang)

### Step 3: Configure Environment Variables

1. Copy `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` dan isi credentials:
   ```env
   VITE_SUPABASE_URL=https://blibawahlbufacgjzqok.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

### Step 4: Setup Database Schema

1. Di Supabase Dashboard, buka **SQL Editor** (📝)
2. Click **"New Query"**
3. Copy-paste isi file `Back-End/database/schema.sql`
4. Click **"Run"** atau tekan `Ctrl+Enter`
5. Tunggu sampai muncul "Success. No rows returned"

### Step 5: Load Sample Data

1. Buat query baru di SQL Editor
2. Copy-paste isi file `Back-End/database/seed-data.sql`
3. Click **"Run"**
4. Verify: Buka **Table Editor** dan cek tables:
   - `trash_bins` - should have 8 rows
   - `iot_devices` - should have 8 rows
   - `capacity_history` - should have ~72 rows
   - `alerts` - should have 4 rows

### Step 6: Enable Realtime (Optional)

1. Buka **Database** > **Replication**
2. Enable replication untuk tables:
   - ✅ `trash_bins`
   - ✅ `iot_devices`
   - ✅ `alerts`

### Step 7: Test Connection

1. Buat file test di root project:
   ```bash
   touch test-supabase.ts
   ```

2. Isi dengan:
   ```typescript
   import { testSupabaseConnection, getSupabaseConfig } from './Back-End/api/supabase-client';
   import { getAllBins } from './Back-End/services/bins.service';

   async function test() {
     console.log('Config:', getSupabaseConfig());
     
     const isConnected = await testSupabaseConnection();
     console.log('Connected:', isConnected);
     
     if (isConnected) {
       const bins = await getAllBins();
       console.log('Total bins:', bins?.length);
       console.log('First bin:', bins?.[0]);
     }
   }

   test();
   ```

3. Run test:
   ```bash
   npx tsx test-supabase.ts
   ```

4. Expected output:
   ```
   Config: { url: 'https://...', hasKey: true }
   ✅ Supabase connected successfully
   Connected: true
   Total bins: 8
   First bin: { bin_id: 'BIN-001', location: 'Labtek V - Floor 1', ... }
   ```

## 🧪 Testing dengan cURL

Test endpoint langsung dengan authorization header:

```bash
curl -X GET 'https://blibawahlbufacgjzqok.supabase.co/rest/v1/trash_bins?select=*' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
[
  {
    "id": "...",
    "bin_id": "BIN-001",
    "location": "Labtek V - Floor 1",
    "capacity_percentage": 45,
    "status": "normal",
    ...
  }
]
```

## 🔒 Security Setup

### Row Level Security (RLS)

Schema sudah include RLS policies. Untuk production:

1. Review policies di **Authentication** > **Policies**
2. Adjust sesuai kebutuhan:
   - Public read untuk monitoring
   - Authenticated write untuk admin

### API Keys

- **anon key**: Safe untuk client-side (public)
- **service_role key**: NEVER expose di frontend (server-only)

## 📊 Verify Database

Di Supabase Dashboard > **Table Editor**, cek data:

### trash_bins
```
BIN-001 | Labtek V - Floor 1      | 45%  | normal
BIN-002 | Labtek VIII - Cafeteria | 92%  | critical
BIN-003 | GKU Timur - Entrance    | 23%  | offline
...
```

### iot_devices
```
ESP32-001 | Labtek V   | 67% | online
ESP32-002 | Labtek VIII| 94% | online
ESP32-003 | GKU Timur  | 12% | offline
...
```

## 🎯 Next Steps

Setelah setup selesai:

1. ✅ Test connection berhasil
2. ✅ Data terload di database
3. ✅ RLS policies active
4. 🔜 Integrate ke React components
5. 🔜 Setup realtime subscriptions
6. 🔜 Deploy Edge Functions (optional)

## 🚨 Troubleshooting

### Error: "Invalid API key"
- ✅ Check `.env` file ada dan terload
- ✅ Restart dev server setelah update .env
- ✅ Verify anon key copied correctly (no spaces)

### Error: "relation does not exist"
- ✅ Run `schema.sql` di SQL Editor
- ✅ Check table names (case-sensitive)

### Error: "permission denied for table"
- ✅ Check RLS policies enabled
- ✅ Verify policies allow SELECT for anon role

### Data tidak muncul
- ✅ Run `seed-data.sql`
- ✅ Check Table Editor untuk verify data
- ✅ Check browser console untuk errors

## 📚 Resources

- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)

## 💡 Tips

- Use **Table Editor** untuk quick data viewing
- Use **SQL Editor** untuk complex queries
- Check **Logs** tab untuk debugging
- Enable **Database Webhooks** untuk external integrations
- Set up **Database Backups** di Settings

---

**Status**: ✅ Backend infrastructure ready!
**Next**: Integrate services ke React dashboard
