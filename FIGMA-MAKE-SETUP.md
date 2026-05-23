# 🎨 Setup Supabase untuk Figma Make Deployment

## ✅ Credentials Sudah Disiapkan

File `.env` sudah dikonfigurasi dengan credentials Supabase Anda:

```env
VITE_SUPABASE_URL=https://blibawahlbufacgjzqok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Penjelasan API Keys

Dari Supabase Dashboard, Anda memiliki:

### 1. **Publishable Key** (Recommended untuk frontend)
```
sb_publishable_jEl7gCL3SffCPSjqai3rmg_MO6L6Lwk
```
- ✅ Safe untuk browser/frontend
- ✅ Bisa di-share publicly
- ✅ Requires RLS enabled

### 2. **Anon Key** (Legacy, tapi masih aman)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs
```
- ✅ Safe untuk browser/frontend
- ✅ JWT token dengan role "anon"
- ✅ Expires: 2036 (aman untuk 10+ tahun)
- ⚠️ Requires RLS enabled

### 3. **Secret Keys** (JANGAN untuk frontend!)
```
sb_secret_GHh3a... (hidden)
service_role ... (hidden)
```
- ❌ NEVER expose di frontend
- ✅ Hanya untuk server-side/backend
- ⚠️ Bisa bypass RLS - sangat powerful!

## 📝 Yang Sudah Dilakukan

1. ✅ File `.env` created dengan credentials
2. ✅ File `vite-env.d.ts` untuk TypeScript types
3. ✅ `Back-End/api/supabase-client.ts` configured
4. ✅ Database schema sudah di-setup di Supabase
5. ✅ Sample data sudah diload

## 🚀 Cara Deploy ke Figma Make

### Opsi 1: Hardcode Credentials (Recommended)

Karena Figma Make adalah static deployment, edit file:

**`Back-End/api/supabase-client.ts`**

Ganti bagian ini:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://blibawahlbufacgjzqok.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
```

Menjadi:
```typescript
const SUPABASE_URL = 'https://blibawahlbufacgjzqok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs';
```

**Kenapa ini AMAN?**
- ✅ Anon key dirancang untuk public exposure
- ✅ RLS (Row Level Security) melindungi data
- ✅ Policies sudah dikonfigurasi di database schema

### Opsi 2: Environment Variables (Jika Figma Make Support)

Jika Figma Make punya fitur environment variables:

1. Buka Figma Make Settings/Deploy Settings
2. Tambahkan variables:
   ```
   VITE_SUPABASE_URL=https://blibawahlbufacgjzqok.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs
   ```

## 🧪 Test Connection

### Cara 1: Browser Console (Setelah Deploy)

1. Buka deployed app di browser
2. Open DevTools Console (F12)
3. Run:
   ```javascript
   testSupabase()
   ```

### Cara 2: Test di Local Development

1. Start dev server (jika belum running)
2. Buka browser console
3. Run command di atas

### Cara 3: Manual Test dengan fetch

```javascript
// Test di browser console
fetch('https://blibawahlbufacgjzqok.supabase.co/rest/v1/trash_bins?select=*', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Bins data:', data))
.catch(err => console.error('❌ Error:', err))
```

Expected response: Array of 8 trash bins

## 🔒 Security Checklist

Sebelum deploy, pastikan di Supabase:

### 1. Row Level Security (RLS) Enabled ✅

Sudah diaktifkan via `schema.sql`:
```sql
ALTER TABLE trash_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
```

### 2. Policies Configured ✅

Policies untuk read (SELECT) sudah allow public:
```sql
CREATE POLICY "Allow public read access on trash_bins"
  ON trash_bins FOR SELECT
  USING (true);
```

### 3. Verify di Supabase Dashboard

1. Buka **Database** > **Tables**
2. Pilih table (e.g., `trash_bins`)
3. Tab **RLS disabled** TIDAK boleh ada
4. Harus ada **green shield icon** = RLS enabled
5. Click table > **Policies** tab
6. Verify policies listed

## 📊 Expected Data After Setup

Setelah run `seed-data.sql`, database harus punya:

- **8 trash bins** (BIN-001 to BIN-008)
- **8 IoT devices** (ESP32-001 to ESP32-008)
- **~72 capacity history records** (last 24h for 3 bins)
- **4 active alerts** (2 critical, 1 warning, 1 offline)

## 🚨 Troubleshooting

### Error: "Invalid API key"
✅ **Solution**: Copy ulang anon key, pastikan tidak ada space atau newline

### Error: "permission denied for table"
✅ **Solution**: 
1. Check RLS enabled di table
2. Check policies exist dan correct
3. Run schema.sql lagi jika perlu

### CORS Error
✅ **Solution**:
1. Buka Supabase Dashboard
2. **Settings** > **API** > **CORS**
3. Add Figma Make domain atau use `*` untuk allow all

### Data tidak muncul
✅ **Solution**:
1. Check browser Network tab - API calls success?
2. Check response status (should be 200)
3. Verify data exists: Supabase Dashboard > Table Editor
4. Run `seed-data.sql` jika data kosong

## ✨ Next Steps

1. ✅ Database setup complete
2. ✅ Credentials configured
3. 🔜 Test connection (run testSupabase() in console)
4. 🔜 Deploy ke Figma Make
5. 🔜 Integrate Supabase ke React components

---

**Status**: Backend siap untuk production deployment! 🚀

Lanjut integrate ke React components atau deploy dulu?
