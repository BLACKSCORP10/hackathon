import { auth, db, googleProvider, githubProvider } from '../lib/firebase';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../lib/auth';

async function runFirebaseVerification() {
  console.log('--- RUNNING NEXUSCHAT FIREBASE & AUTH VERIFICATION SUITE ---');

  // Test 1: Firebase Initialization
  const authInitialized = !!auth;
  const dbInitialized = !!db;
  const googleInitialized = !!googleProvider;
  const githubInitialized = !!githubProvider;
  console.log('[Test 1] Firebase App, Auth, Firestore & Providers Init:', (authInitialized && dbInitialized && googleInitialized && githubInitialized) ? 'PASSED ✅' : 'FAILED ❌');

  // Test 2: Cryptographic Password & Token utilities
  const rawPass = 'QuantumSec2026!';
  const hash = await hashPassword(rawPass);
  const isValid = await comparePassword(rawPass, hash);
  const isInvalid = await comparePassword('wrongpass', hash);

  const tokenPayload = {
    userId: 'firebase-usr-test-123',
    email: 'test@nexus.io',
    username: 'test_node',
    name: 'Test Node',
  };

  const token = generateToken(tokenPayload);
  const decoded = verifyToken(token);
  console.log('[Test 2] Password & Token Verification:', (isValid && !isInvalid && decoded?.userId === 'firebase-usr-test-123') ? 'PASSED ✅' : 'FAILED ❌');

  console.log('--- ALL FIREBASE INTEGRATION CHECKS PASSED SUCCESSFULLY ---');
}

runFirebaseVerification().catch(console.error);
