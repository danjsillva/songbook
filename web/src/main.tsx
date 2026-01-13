import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { MobileControlsProvider } from './contexts/MobileControlsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MobileControlsProvider>
        <App />
      </MobileControlsProvider>
    </AuthProvider>
  </StrictMode>,
)
