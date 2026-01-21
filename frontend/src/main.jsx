// App initialization & BrowserRouter
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import QueryProvider from './providers/QueryProvider'; 


// Mantine
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <QueryProvider> 
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider> 
  </React.StrictMode>,
)