/**
 * Converts Firebase client errors into clear, non-sensitive messages for the
 * sign-in screens. Firebase's raw messages are deliberately not shown.
 */
export function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Your email address or password is incorrect.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Authentication.";
    case "auth/invalid-api-key":
      return "Firebase is not configured correctly. Please contact the hotel.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Could not sign you in. Please try again.";
  }
}
