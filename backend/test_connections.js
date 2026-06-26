const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

async function runTests() {
  console.log("=== Bắt đầu Audit Hệ thống ===");

  // 1. Test MongoDB
  console.log("\n[1] Testing MongoDB Connection...");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully.");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Tìm thấy ${collections.length} collections trong Database (TirTir-Project).`);
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
  }

  // 2. Test Firebase & Firestore
  console.log("\n[2] Testing Firebase Admin & Firestore...");
  try {
    const fs = require('fs');
    const path = require('path');
    let serviceAccount;
    if (fs.existsSync('/etc/secrets/serviceAccountKey.json')) {
      serviceAccount = require('/etc/secrets/serviceAccountKey.json');
    } else if (fs.existsSync(path.join(__dirname, 'serviceAccountKey.json'))) {
      serviceAccount = require('./serviceAccountKey.json');
    } else {
      serviceAccount = require('./config/serviceAccountKey.json');
    }

    try {
      admin.initializeApp({
        credential: admin.cert(serviceAccount)
      });
      console.log("✅ Firebase Admin Initialized Successfully.");
    } catch (e) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }
    
    const db = getFirestore();
    const testDocRef = db.collection('audit_test').doc('ping');
    
    // Test Write
    await testDocRef.set({ timestamp: Date.now(), message: 'Audit Test' });
    console.log("✅ Firestore Write Access: OK.");
    
    // Test Read
    const readDoc = await testDocRef.get();
    if (readDoc.exists) {
      console.log("✅ Firestore Read Access: OK.");
    } else {
      console.log("❌ Firestore Read Access: Failed (Document not found).");
    }
    
    // Test Delete (Cleanup)
    await testDocRef.delete();
    console.log("✅ Firestore Delete Access (Cleanup): OK.");

  } catch (err) {
    console.error("❌ Firebase/Firestore Test Failed:", err.message);
  }

  console.log("\n=== Audit Hoàn Tất ===");
  process.exit(0);
}

runTests();
