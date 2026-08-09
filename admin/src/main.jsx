import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { RecordProvider } from './context/RecordContext';
import { SocketProvider } from './context/SocketContext';
import ToastProvider from './components/common/Toast';
import { NotificationManagerProvider } from './components/common/NotificationManager';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RecordProvider>
          <ToastProvider>
            <NotificationManagerProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </NotificationManagerProvider>
          </ToastProvider>
        </RecordProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

window.addEventListener('load', () => {
  const bootLoader = document.getElementById('app-loader');
  if (bootLoader) {
    bootLoader.classList.add('app-loader-hidden');
    setTimeout(() => bootLoader.remove(), 500);
  }
});
