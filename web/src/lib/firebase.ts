import { initializeApp, type FirebaseApp } from 'firebase/app'
import type { Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

let app: FirebaseApp | null = null
let db: Database | null = null

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

// Lazy load Realtime Database - only when presence features needed
export async function getFirebaseDatabase(): Promise<Database> {
  if (db) return db
  const { getDatabase } = await import('firebase/database')
  db = getDatabase(getFirebaseApp())
  return db
}
