import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize once per function instance
const app = initializeApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
