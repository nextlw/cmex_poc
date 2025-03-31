import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { SessionProvider } from "./auth/SessionContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <SessionProvider>
        <div className="min-h-screen w-full overflow-auto">
          <div className="w-full mx-auto">
            <App />
          </div>
        </div>
      </SessionProvider>
    </React.StrictMode>
  );
}
