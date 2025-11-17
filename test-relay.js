#!/usr/bin/env node
// Test WebSocket connection to relay
import https from 'https';
import http from 'http';

const RELAY_URL = 'wss://relay.anmore.me';
const RELAY_HOST = 'relay.anmore.me';

console.log('Testing relay connection...');
console.log('Relay URL:', RELAY_URL);
console.log('Relay Host:', RELAY_HOST);

// Test HTTPS endpoint
const httpsOptions = {
  hostname: RELAY_HOST,
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 5000
};

console.log('\n1. Testing HTTPS connection...');
const httpsReq = https.request(httpsOptions, (res) => {
  console.log('✅ HTTPS Status:', res.statusCode);
  console.log('✅ HTTPS Headers:', res.headers);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('✅ HTTPS connection successful\n');
  });
});

httpsReq.on('error', (e) => {
  console.log('❌ HTTPS Error:', e.message);
});

httpsReq.on('timeout', () => {
  console.log('❌ HTTPS Timeout');
  httpsReq.destroy();
});

httpsReq.setTimeout(5000);
httpsReq.end();

// Test HTTP endpoint
console.log('2. Testing HTTP connection...');
const httpOptions = {
  hostname: RELAY_HOST,
  port: 80,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const httpReq = http.request(httpOptions, (res) => {
  console.log('✅ HTTP Status:', res.statusCode);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('✅ HTTP connection successful\n');
  });
});

httpReq.on('error', (e) => {
  console.log('❌ HTTP Error:', e.message);
});

httpReq.on('timeout', () => {
  console.log('❌ HTTP Timeout');
  httpReq.destroy();
});

httpReq.setTimeout(5000);
httpReq.end();

// Note: WebSocket testing requires ws library
console.log('3. WebSocket test requires browser or ws library');
console.log('   To test WebSocket, visit: https://anmore.me/diagnostic.html');

