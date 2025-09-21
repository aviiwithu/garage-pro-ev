/**
 * @fileOverview Service for handling data synchronization with Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Writes data from an external source to a dedicated 'syncedData' collection in Firestore.
 * This service centralizes the database interaction logic, making the API flow cleaner
 * and easier to maintain. It supports multi-source integration by storing the original
 * source along with the data payload.
 *
 * @param source - The identifier of the external system providing the data.
 * @param payload - The data object to be stored.
 * @returns The ID of the newly created Firestore document.
 */
export async function syncDataToFirestore(source: string, payload: any): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'syncedData'), {
      source: source,
      payload: payload,
      syncedAt: serverTimestamp(), // Timestamps the synchronization
    });
    return docRef.id;
  } catch (error) {
    console.error('Firestore Sync Error: Could not write document.', error);
    throw new Error('Failed to save data to the database.');
  }
}
