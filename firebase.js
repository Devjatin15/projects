import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7HoNWDQX71PPUm_lFVQBBBCt4BugyJHY",
  authDomain: "worksmart-b899b.firebaseapp.com",
  projectId: "worksmart-b899b",
  storageBucket: "worksmart-b899b.firebasestorage.app",
  messagingSenderId: "864052016879",
  appId: "1:864052016879:web:b6fa9ccb345191217acd1a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);