#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
});

// Initialize Firebase Admin
const credential = admin.credential.cert({
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: (env.FIREBASE_PRIVATE_KEY || '')
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n'),
});

admin.initializeApp({ credential });
const db = admin.firestore();

// Import queryFreeBusy
const { queryFreeBusy } = require('../src/lib/google/calendar.ts');

async function testFreeBusy() {
  console.log('\n🔍 Testing queryFreeBusy for Etienne Delsy\n');

  try {
    // Get user
    const hostSnap = await db.collection('hosts').where('email', '==', 'dolbyjoab@gmail.com').get();
    const uid = hostSnap.docs[0].id;

    // Get calendars
    const calsSnap = await db
      .collection('hosts')
      .doc(uid)
      .collection('connected_calendars')
      .where('isActive', '==', true)
      .get();

    if (calsSnap.empty) {
      console.log('❌ No active calendars found');
      process.exit(1);
    }

    const calendars = calsSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    console.log(`✅ Found ${calendars.length} calendar(s)`);
    console.log(`   Calendar ID: ${calendars[0].calendarId}`);
    console.log(`   Account: ${calendars[0].accountEmail}\n`);

    // Test queryFreeBusy
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📅 Querying free/busy from ${now.toISOString()} to ${endOfDay.toISOString()}\n`);

    const result = await queryFreeBusy(calendars, now, endOfDay);

    console.log(`✅ queryFreeBusy succeeded!`);
    console.log(`   Result type: ${result.constructor.name}`);
    console.log(`   Map size: ${result.size}`);

    for (const [calId, busySlots] of result) {
      console.log(`\n   Calendar: ${calId}`);
      console.log(`   Busy slots: ${busySlots.length}`);
      if (busySlots.length > 0) {
        busySlots.slice(0, 3).forEach(slot => {
          console.log(`     - ${new Date(slot.start).toLocaleTimeString()} to ${new Date(slot.end).toLocaleTimeString()}`);
        });
        if (busySlots.length > 3) {
          console.log(`     ... and ${busySlots.length - 3} more`);
        }
      } else {
        console.log(`     (No busy times right now)`);
      }
    }

    console.log('\n✅ Test complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFreeBusy();
