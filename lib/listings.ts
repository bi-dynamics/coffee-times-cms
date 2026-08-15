import { collection, getCountFromServer } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CATEGORIES, type Category } from "@/lib/schemas";

export type CategoryCounts = Record<Category, number>;

/**
 * Counts documents in every category collection using Firestore's server-side
 * aggregation, so we never download the documents just to length-check them.
 *
 * A failure on one category (missing collection, rules) must not blank out the
 * whole dashboard, so each count settles independently and falls back to 0.
 */
export async function getListingCounts(): Promise<{
  counts: CategoryCounts;
  total: number;
  failed: Category[];
}> {
  const results = await Promise.allSettled(
    CATEGORIES.map(async (cat) => {
      const snapshot = await getCountFromServer(collection(db, cat.id));
      return { id: cat.id, count: snapshot.data().count };
    })
  );

  const counts = {} as CategoryCounts;
  const failed: Category[] = [];
  let total = 0;

  results.forEach((result, index) => {
    const id = CATEGORIES[index].id;
    if (result.status === "fulfilled") {
      counts[id] = result.value.count;
      total += result.value.count;
    } else {
      counts[id] = 0;
      failed.push(id);
      console.error(`Failed to count listings for "${id}":`, result.reason);
    }
  });

  return { counts, total, failed };
}
