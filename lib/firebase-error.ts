import { FirebaseError } from "firebase/app";

/**
 * Firebase throws typed errors with a machine-readable `code`. The UI used to
 * discard these entirely ("Failed to upload images"), which made permission and
 * configuration problems indistinguishable from network blips. These helpers
 * turn a code into something an admin can act on, while keeping the raw code
 * visible for support.
 */
const STORAGE_MESSAGES: Record<string, string> = {
  "storage/unauthorized":
    "Firebase Storage rejected the upload. The Storage security rules do not allow writes for this account.",
  "storage/unauthenticated":
    "Your session has expired. Sign out and sign back in, then try again.",
  "storage/bucket-not-found":
    "The configured Storage bucket does not exist. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.",
  "storage/project-not-found":
    "The configured Firebase project does not exist. Check NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
  "storage/quota-exceeded": "The Storage quota for this project has been exceeded.",
  "storage/retry-limit-exceeded":
    "The upload timed out. Check your connection and try a smaller file.",
  "storage/invalid-checksum": "The file was corrupted in transit. Please try again.",
  "storage/canceled": "The upload was cancelled.",
  "storage/no-default-bucket":
    "No Storage bucket is configured for this project. Enable Storage in the Firebase console.",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied":
    "Firestore rejected the request. The security rules do not allow this operation for your account.",
  unauthenticated: "Your session has expired. Sign out and sign back in, then try again.",
  unavailable: "Could not reach Firestore. Check your connection and try again.",
  "failed-precondition":
    "Firestore needs an index for this query. Check the browser console for the creation link.",
  "not-found": "That record no longer exists.",
};

function describe(error: unknown, table: Record<string, string>, fallback: string): string {
  if (error instanceof FirebaseError) {
    const known = table[error.code];
    return known ? `${known} (${error.code})` : `${fallback} (${error.code})`;
  }
  if (error instanceof Error && error.message) {
    return `${fallback}: ${error.message}`;
  }
  return fallback;
}

export function describeStorageError(error: unknown): string {
  return describe(error, STORAGE_MESSAGES, "Upload failed");
}

export function describeFirestoreError(error: unknown): string {
  return describe(error, FIRESTORE_MESSAGES, "Request failed");
}
