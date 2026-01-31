
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBHguqBiwres4qMDstnaq-4KYQiRb0JTgE",
  authDomain: "admin-wh1.firebaseapp.com",
  projectId: "admin-wh1",
  storageBucket: "admin-wh1.firebasestorage.app",
  messagingSenderId: "1072795813221",
  appId: "1:1072795813221:web:e27f6787c25c734d83cd8c",
  measurementId: "G-CEK74QFCW8"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let firebaseConnected = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('Firebase initialized');
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const testFirebaseConnection = async (): Promise<boolean> => {
  if (!auth) {
    firebaseConnected = false;
    return false;
  }
  try {
    await signInAnonymously(auth);
    firebaseConnected = true;
    console.log('✅ Firebase connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    firebaseConnected = false;
    return false;
  }
};

export const isFirebaseConnected = (): boolean => firebaseConnected;

export const saveToFirestore = async (collectionName: string, data: any, docId: string | null = null): Promise<string | null> => {
  if (!firebaseConnected) {
    console.warn('Firebase not connected. Data not saved to Firestore.');
    return null;
  }

  try {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = { ...data, updatedAt: timestamp };

    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, dataWithTimestamp);
      console.log(`✅ Updated document in ${collectionName}:`, docId);
      return docId;
    } else {
      const dataToCreate = { ...dataWithTimestamp, createdAt: timestamp };
      const docRef = await addDoc(collection(db, collectionName), dataToCreate);
      console.log(`✅ Saved to Firestore collection ${collectionName}:`, docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error(`❌ Error saving to Firestore collection ${collectionName}:`, error);
    return null;
  }
};

export const getFromFirestore = async <T,>(collectionName: string): Promise<T[]> => {
  if (!firebaseConnected) {
    console.warn('Firebase not connected. Cannot retrieve data from Firestore.');
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as T);
    });
    console.log(`✅ Retrieved ${data.length} documents from ${collectionName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error getting data from Firestore collection ${collectionName}:`, error);
    return [];
  }
};

export const clearFirestoreCollection = async (collectionName: string): Promise<boolean> => {
  if (!firebaseConnected) {
    console.warn('Firebase not connected. Cannot clear collection.');
    return false;
  }
  try {
    console.log(`🗑️ Clearing all documents from ${collectionName}...`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    if (querySnapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      return true;
    }

    const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, collectionName, document.id)));
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${querySnapshot.size} documents from ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing collection ${collectionName}:`, error);
    return false;
  }
};
