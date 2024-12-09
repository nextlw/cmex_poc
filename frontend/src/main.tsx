import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { SessionProvider } from './auth/SessionContext';

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <SessionProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
          <div className="max-w-4xl mx-auto">
            <App />
          </div>
        </div>
      </SessionProvider>
    </React.StrictMode>
  );
}
