// App initialization & BrowserRouter
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import QueryProvider from './providers/QueryProvider'; 
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css'; // Make sure styles are imported!

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <QueryProvider> 
        <MantineProvider> {/* Add this */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MantineProvider>
      </QueryProvider> 
  </React.StrictMode>,
)