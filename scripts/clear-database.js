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

// Initialize Firebase Admin using environment variables
const credential = admin.credential.cert({
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: (env.FIREBASE_PRIVATE_KEY || '')
    .replace(/^"|"$/g, '')   // strip surrounding quotes
    .replace(/\\n/g, '\n'),  // convert literal \n to real newlines
});

admin.initializeApp({ credential });

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const batch = db.batch();
  const snapshot = await db.collection(collectionPath).get();

  if (snapshot.empty) {
    console.log(`  → ${collectionPath}: already empty`);
    return;
  }

  console.log(`  → Deleting ${snapshot.size} documents from ${collectionPath}...`);
  let count = 0;
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    count++;
    if (count % 100 === 0) {
      console.log(`     Progress: ${count}/${snapshot.size}`);
    }
  });

  await batch.commit();
  console.log(`  ✓ ${collectionPath} cleared`);
}

async function deleteSubcollections(parentPath) {
  const parentDoc = await db.doc(parentPath).get();
  if (!parentDoc.exists) return;

  const subcollections = await parentDoc.ref.listCollections();
  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    if (snapshot.empty) continue;

    console.log(`    → Deleting ${snapshot.size} from ${parentPath}/${subcollection.id}...`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing Firestore database...\n');

  try {
    // Delete main collections
    console.log('Clearing main collections:');
    await deleteCollection('bookings');
    await deleteCollection('booking_links');
    await deleteCollection('hosts');
    await deleteCollection('slot_reservations');

    // Delete subcollections within hosts (availability, connected_calendars, blackout_dates, etc.)
    console.log('\nClearing hosts subcollections:');
    const hostsSnapshot = await db.collection('hosts').get();
    for (const hostDoc of hostsSnapshot.docs) {
      const hostPath = `hosts/${hostDoc.id}`;
      const subcollections = await hostDoc.ref.listCollections();
      for (const subcollection of subcollections) {
        const snapshot = await subcollection.get();
        if (snapshot.empty) continue;

        console.log(`  → Deleting ${subcollection.id} for host ${hostDoc.id}...`);
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    console.log('\n✅ Database cleared successfully!\n');
    console.log('Ready to test with fresh data.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
