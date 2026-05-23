# 🚀 SAMPURNA Deployment Guide - Figma Make

Panduan deploy SAMPURNA Dashboard ke Figma Make dengan Supabase backend.

## 📋 Environment Variables untuk Figma Make

Karena Figma Make deploy sebagai static frontend, environment variables perlu dikonfigurasi di **build time**, bukan runtime.

### Cara 1: Hardcode di Source Code (Recommended untuk Figma Make)

Untuk Figma Make deployment, karena ini adalah static site, environment variables akan di-bundle saat build. 

Update file `Back-End/api/supabase-client.ts` langsung dengan credentials:

```typescript
// Hardcoded untuk production deployment
const SUPABASE_URL = 'https://blibawahlbufacgjzqok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs';
```

**⚠️ IMPORTANT:** Anon key adalah PUBLIC key dan AMAN untuk di-expose di frontend, selama:
- ✅ Row Level Security (RLS) enabled
- ✅ Policies configured dengan benar
- ❌ JANGAN gunakan `service_role` secret key di frontend!

### Cara 2: Environment Variables di Build Time

Jika Figma Make support environment variables:

1. Di Figma Make settings/deployment config, tambahkan:
   ```
   VITE_SUPABASE_URL=https://blibawahlbufacgjzqok.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Code sudah dikonfigurasi untuk membaca dari `import.meta.env`

## 🔒 Security Checklist

### ✅ Safe untuk Production:
- [x] `VITE_SUPABASE_URL` - public URL
- [x] `VITE_SUPABASE_ANON_KEY` - public anon key (dengan RLS)
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` - new publishable key

### ❌ NEVER Expose in Frontend:
- [ ] `service_role` secret key
- [ ] `secret` API keys
- [ ] Database passwords
- [ ] Private credentials

## 🗄️ Supabase Security Setup

### 1. Verify Row Level Security (RLS)

Di Supabase Dashboard > Authentication > Policies:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

### 2. Check Policies

Pastikan policies sudah aktif untuk semua tables:
- ✅ `trash_bins` - read: public, write: authenticated
- ✅ `iot_devices` - read: public, write: authenticated  
- ✅ `capacity_history` - read: public, write: authenticated
- ✅ `alerts` - read: public, write: authenticated

### 3. API Settings

Di Supabase Dashboard > Settings > API:
- ✅ **CORS**: Allow from Figma Make domain
- ✅ **Rate Limiting**: Enabled
- ✅ **Auto Schema Reload**: Enabled

## 📱 Frontend Integration

### Update Supabase Client (Production Mode)

Buat file `Back-End/api/supabase-client.production.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Production configuration - hardcoded
const SUPABASE_URL = 'https://blibawahlbufacgjzqok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Test Production Config

```bash
npx tsx test-backend.ts
```

Expected output:
```
✅ Supabase connected successfully
✅ Found 8 trash bins
✅ Found 8 IoT devices
✅ Found 4 active alerts
```

## 🚀 Deployment Steps

### 1. Pre-deployment Checklist

- [x] Database schema deployed (`schema.sql`)
- [x] Sample data loaded (`seed-data.sql`)
- [x] RLS policies enabled
- [x] API keys configured
- [x] Frontend tested locally with real Supabase
- [ ] Remove console.logs (optional)
- [ ] Optimize bundle size

### 2. Deploy to Figma Make

1. Open your Make file
2. Click **Deploy** or **Publish**
3. (Optional) Add environment variables if supported
4. Deploy dan tunggu build selesai

### 3. Post-deployment Verification

Setelah deploy, test:

1. **Frontend Loading**: Dashboard loads tanpa error
2. **Data Fetching**: Bins dan devices data muncul
3. **Real-time**: Test realtime updates (jika enabled)
4. **CORS**: No CORS errors di browser console
5. **Performance**: Check Supabase dashboard untuk usage metrics

## 🔍 Monitoring & Debugging

### Supabase Dashboard

Monitor di **Logs** tab:
- API requests
- Auth events
- Errors

### Browser DevTools

Check:
```javascript
// Test connection di browser console
fetch('https://blibawahlbufacgjzqok.supabase.co/rest/v1/trash_bins?select=*', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
.then(r => r.json())
.then(console.log)
```

## 📊 Production URLs

- **Frontend**: [Your Figma Make URL]
- **Backend**: https://blibawahlbufacgjzqok.supabase.co
- **Database**: Supabase PostgreSQL
- **Realtime**: wss://blibawahlbufacgjzqok.supabase.co/realtime/v1

## 🛠️ Troubleshooting

### Error: "Invalid API key"
- ✅ Verify anon key copied correctly
- ✅ No extra spaces or line breaks
- ✅ Check expiration (exp: 2093563631 = year 2036, safe)

### Error: "permission denied for table"
- ✅ Enable RLS policies
- ✅ Check policy definitions
- ✅ Test in Supabase SQL editor first

### CORS errors
- ✅ Add Figma Make domain to Supabase allowed origins
- ✅ Settings > API > CORS

### Data not loading
- ✅ Check browser Network tab
- ✅ Verify API responses (200 OK)
- ✅ Check Supabase Logs tab
- ✅ Verify RLS policies allow SELECT

## 💡 Best Practices

1. **Keep anon key in code** - It's designed to be public
2. **Never use service_role in frontend** - Server-side only
3. **Monitor Supabase usage** - Check quotas and limits
4. **Enable caching** - Use Supabase's built-in caching
5. **Optimize queries** - Select only needed columns
6. **Handle errors gracefully** - Show user-friendly messages

## 📈 Performance Optimization

```typescript
// Good: Select specific columns
const { data } = await supabase
  .from('trash_bins')
  .select('bin_id, location, capacity_percentage, status')
  .limit(10);

// Bad: Select all
const { data } = await supabase
  .from('trash_bins')
  .select('*');
```

## 🔄 Updates & Maintenance

Untuk update production:
1. Test changes locally first
2. Deploy schema changes via SQL editor
3. Update frontend code
4. Redeploy via Figma Make
5. Verify changes in production

---

**Status**: ✅ Ready for deployment!
**Support**: Check Supabase docs or Figma Make docs untuk troubleshooting
