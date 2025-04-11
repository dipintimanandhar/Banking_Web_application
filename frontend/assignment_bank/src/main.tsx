import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId='206150942567-lqb9kraptc3lg932pkj9l5i102eihjhe.apps.googleusercontent.com'>
    <StrictMode>
      <App />
    </StrictMode>

  </GoogleOAuthProvider>

)
