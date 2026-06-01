#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local not found at', envPath);
  process.exit(1);
}

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

async function debugCalendar() {
  console.log('\n🔍 Searching for user with email: dolbyjoab@gmail.com\n');

  try {
    // Find user by email
    const hostSnap = await db.collection('hosts').where('email', '==', 'dolbyjoab@gmail.com').get();

    if (hostSnap.empty) {
      console.log('❌ No user found with that email');
      process.exit(1);
    }

    const hostDoc = hostSnap.docs[0];
    const hostData = hostDoc.data();
    const uid = hostDoc.id;

    console.log(`✅ Found user: ${hostData.name} (${uid})`);
    console.log(`   Email: ${hostData.email}`);
    console.log(`   Timezone: ${hostData.timezone}\n`);

    // Get connected calendars
    console.log('📅 Connected Calendars:\n');
    const calsSnap = await db
      .collection('hosts')
      .doc(uid)
      .collection('connected_calendars')
      .get();

    if (calsSnap.empty) {
      console.log('❌ No connected calendars found\n');
      process.exit(0);
    }

    for (const calDoc of calsSnap.docs) {
      const cal = calDoc.data();
      console.log(`   Document ID: ${calDoc.id}`);
      console.log(`   Provider: ${cal.provider}`);
      console.log(`   Account Email: ${cal.accountEmail}`);
      console.log(`   Calendar ID: ${cal.calendarId}`);
      console.log(`   Label: ${cal.label}`);
      console.log(`   Is Active: ${cal.isActive}`);
      console.log(`   Access Token: ${cal.accessToken ? '✅ Present' : '❌ MISSING'}`);
      console.log(`   Refresh Token: ${cal.refreshToken ? '✅ Present' : '❌ MISSING'}`);
      console.log(`   Expires At: ${cal.expiresAt}`);
      console.log(`   Created At: ${cal.createdAt}`);

      // Check if token is expired
      if (cal.expiresAt) {
        const expiresAt = new Date(cal.expiresAt);
        const now = new Date();
        const isExpired = expiresAt < now;
        const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
        console.log(`   Token Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'} (${hoursUntilExpiry.toFixed(1)} hours remaining)`);
      }

      console.log('');
    }

    // Get availability
    console.log('📋 Availability Settings:\n');
    const availSnap = await db
      .collection('hosts')
      .doc(uid)
      .collection('availability')
      .get();

    if (availSnap.empty) {
      console.log('❌ No availability settings found\n');
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const availDoc of availSnap.docs) {
        const avail = availDoc.data();
        const dayOfWeek = parseInt(availDoc.id, 10);
        const dayName = dayNames[dayOfWeek] || 'Unknown';

        if (avail.ranges && avail.ranges.length > 0) {
          console.log(`   ${dayName}:`);
          for (const range of avail.ranges) {
            console.log(`     ${range.startTime} - ${range.endTime}`);
          }
        }
      }
      console.log('');
    }

    console.log('✅ Debug complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugCalendar();
