import { initializeApp, type FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  return app
}

// Lazy load auth module - only when user clicks login
export async function getFirebaseAuth() {
  const { getAuth, GoogleAuthProvider } = await import('firebase/auth')
  const auth = getAuth(getFirebaseApp())
  const provider = new GoogleAuthProvider()
  return { auth, provider }
}
