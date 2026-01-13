import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { MobileControlsProvider } from './contexts/MobileControlsContext'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MobileControlsProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MobileControlsProvider>
    </AuthProvider>
  </StrictMode>,
)
