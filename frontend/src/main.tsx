import { StrictMode } from "react"; // enable dev only checks for all components inside it, like warn against depricated api, double invoke...
import { createRoot } from "react-dom/client"; // react18 way of mounting the app
import App from "./App";
import { BrowserRouter } from "react-router-dom"; // enable client side routing
import "./styles/global.scss";
import { AuthProvider } from "./context/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./services/queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/applythis">
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
