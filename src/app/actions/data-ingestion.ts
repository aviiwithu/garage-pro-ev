

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
  data: Record<string, any>[],
  duplicate?: "overwrite" | "skip"
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
      const id = item.id || item.employeeId || item.partNumber;
      let docRef = doc(collectionRef);
      const updateOrCreateData: any = { ...item };
      if (id) {
        docRef = doc(collectionRef, id);
        updateOrCreateData.id = id;
      }


      Object.keys(updateOrCreateData).forEach(key => {
        if (updateOrCreateData[key] === undefined) {
          updateOrCreateData[key] = null;
        }
      });

      batch.set(docRef, updateOrCreateData);
    });

    await batch.commit();
  }
}
