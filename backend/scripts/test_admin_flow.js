const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin_test_auto@tirtir.com';
const ADMIN_PASS = 'admin123';

async function setupAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/user.model');
  await User.deleteOne({ email: ADMIN_EMAIL });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASS, salt);
  const admin = new User({ name: 'Auto Admin', email: ADMIN_EMAIL, password: hashedPassword, role: 'admin', isEmailVerified: true });
  await admin.save();
  await mongoose.connection.close();
}

async function loginAdmin() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login failed');
  return data.token;
}

async function run() {
  await setupAdmin();
  const token = await loginAdmin();

  const createPayload = {
    Product_ID: 'TEST-AUTO-001',
    Name: 'Tirtir Auto Test Cushion',
    Price: 350000,
    Category: 'Cushion',
    Description_Short: 'Automated test product',
    Stock_Quantity: 50
  };
  let r = await fetch(`${API_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(createPayload)
  });
  console.log('Create:', r.status, await r.json());

  r = await fetch(`${API_URL}/admin/products/TEST-AUTO-001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ Price: 400000, Stock_Quantity: 45 })
  });
  console.log('Update:', r.status, await r.json());

  r = await fetch(`${API_URL}/admin/products/TEST-AUTO-001/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ stock: 100 })
  });
  console.log('Stock:', r.status, await r.json());

  const bulkPayload = [
    { Product_ID: 'TEST-AUTO-001', Name: 'Tirtir Auto Test Cushion', Price: 420000, Category: 'Cushion', Stock_Quantity: 60 },
    { Product_ID: 'TEST-AUTO-002', Name: 'Tirtir Auto Test Serum', Price: 250000, Category: 'Serum', Stock_Quantity: 30 }
  ];
  r = await fetch(`${API_URL}/admin/products/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(bulkPayload)
  });
  console.log('Bulk:', r.status, await r.json());

  r = await fetch(`${API_URL}/admin/products/TEST-AUTO-001`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Delete1:', r.status, await r.json());

  r = await fetch(`${API_URL}/admin/products/TEST-AUTO-002`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Delete2:', r.status, await r.json());
}

run().catch(e => { console.error(e); process.exitCode = 1; });
