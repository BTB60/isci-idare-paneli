#!/usr/bin/env node
/**
 * JWT_SECRET və JWT_REFRESH_SECRET üçün təsadüfi hex (hər biri 64 simvol).
 * Çıxışı backend/.env və ya Fly secrets üçün kopyalayın.
 */
const crypto = require('crypto');
const a = crypto.randomBytes(32).toString('hex');
const b = crypto.randomBytes(32).toString('hex');
console.log('Aşağıdakıları backend/.env-ə əlavə edin və ya: fly secrets set ...');
console.log('');
console.log(`JWT_SECRET=${a}`);
console.log(`JWT_REFRESH_SECRET=${b}`);
console.log('');
