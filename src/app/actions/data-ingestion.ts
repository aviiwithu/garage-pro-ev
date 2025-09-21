'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

/**
 * Batches writes to a specified Firestore collection.
 * This is used for bulk importing data from CSV files.
 *
 * @param collectionName - The name of the Firestore collection.
 * @param data - An array of objects to import.
 */
export async function batchImportData(
  collectionName: string,
  data: Record<string, any>[]
): Promise<void> {
  if (data.length === 0) {
    return;
  }

  // Use a separate writeBatch for every 500 documents to avoid limits.
  const chunks = [];
  for (let i = 0; i < data.length; i += 500) {
    chunks.push(data.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);

    chunk.forEach((item) => {
      // Prioritize a specific ID field if it exists, otherwise Firestore generates one.
      const id = item.employeeId || item.partNumber || item.id || doc(collectionRef).id;
      const docRef = doc(collectionRef, id);
      batch.set(docRef, { ...item, id }); // Ensure the ID is part of the document data
    });

    await batch.commit();
  }
}
