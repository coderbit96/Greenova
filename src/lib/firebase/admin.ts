import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function hasServerCredentials() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

function getFirebaseAdminAuth() {
  if (!hasServerCredentials()) return null;

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

  return getAuth(app);
}

/**
 * Verifies a Firebase-issued ID token on the server. Browser claims such as
 * email, name and provider are never accepted without this verification.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken | null> {
  const auth = getFirebaseAdminAuth();
  if (!auth || !idToken || idToken.length > 16_384) return null;

  try {
    return await auth.verifyIdToken(idToken, true);
  } catch {
    return null;
  }
}
