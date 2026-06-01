#!/usr/bin/env node

const http = require('http');

async function testAPI() {
  console.log('\n🔍 Testing /api/dashboard/team-availability\n');

  const members = [
    { uid: 'at6jDLmcVdQFOxaX1oJq6gU4ANf1', name: 'Etienne Delsy' }
  ];

  const postData = JSON.stringify({ members });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dashboard/team-availability',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response:\n`);
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

testAPI().catch(err => process.exit(1));
