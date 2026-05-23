#!/usr/bin/env tsx
/**
 * SAMPURNA Backend Connection Test
 * Run: npx tsx test-backend.ts
 */

import { testSupabaseConnection, getSupabaseConfig } from './Back-End/api/supabase-client';
import { getAllBins } from './Back-End/services/bins.service';
import { getAllDevices } from './Back-End/services/devices.service';
import { getActiveAlerts } from './Back-End/services/analytics.service';

async function testBackend() {
  console.log('🧪 Testing SAMPURNA Backend Connection...\n');

  // Test 1: Check configuration
  console.log('1️⃣ Checking configuration...');
  const config = getSupabaseConfig();
  console.log(`   URL: ${config.url}`);
  console.log(`   API Key: ${config.hasKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!config.hasKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY not found!');
    console.log('📝 Please configure .env file:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Add your Supabase credentials');
    console.log('   3. Restart the dev server\n');
    return;
  }

  // Test 2: Test connection
  console.log('2️⃣ Testing Supabase connection...');
  const isConnected = await testSupabaseConnection();
  console.log('');

  if (!isConnected) {
    console.error('❌ Connection failed! Check your credentials and network.\n');
    return;
  }

  // Test 3: Fetch trash bins
  console.log('3️⃣ Fetching trash bins...');
  try {
    const bins = await getAllBins();
    console.log(`   ✅ Found ${bins?.length || 0} trash bins`);
    if (bins && bins.length > 0) {
      console.log(`   📍 Sample: ${bins[0].bin_id} - ${bins[0].location} (${bins[0].capacity_percentage}%)\n`);
    }
  } catch (error) {
    console.error('   ❌ Error fetching bins:', error);
  }

  // Test 4: Fetch IoT devices
  console.log('4️⃣ Fetching IoT devices...');
  try {
    const devices = await getAllDevices();
    console.log(`   ✅ Found ${devices?.length || 0} IoT devices`);
    if (devices && devices.length > 0) {
      const online = devices.filter(d => d.network_status === 'online').length;
      console.log(`   🟢 Online: ${online} | 🔴 Offline: ${devices.length - online}\n`);
    }
  } catch (error) {
    console.error('   ❌ Error fetching devices:', error);
  }

  // Test 5: Fetch active alerts
  console.log('5️⃣ Fetching active alerts...');
  try {
    const alerts = await getActiveAlerts();
    console.log(`   ✅ Found ${alerts?.length || 0} active alerts`);
    if (alerts && alerts.length > 0) {
      const critical = alerts.filter(a => a.alert_type === 'critical').length;
      console.log(`   🚨 Critical: ${critical} | ⚠️  Warning: ${alerts.length - critical}\n`);
    }
  } catch (error) {
    console.error('   ❌ Error fetching alerts:', error);
  }

  console.log('✅ Backend test completed!\n');
  console.log('📊 Next steps:');
  console.log('   - Integrate services into React components');
  console.log('   - Setup real-time subscriptions');
  console.log('   - Deploy to production\n');
}

// Run test
testBackend().catch(console.error);
