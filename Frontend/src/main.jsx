import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min"; 
import "react-toastify/dist/ReactToastify.css";
import "./dashboard-settings.css";
import { DashboardSettingsProvider } from "./context/dashboardSettingsContext.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DashboardSettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DashboardSettingsProvider>
  </StrictMode>,
)
