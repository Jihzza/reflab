import { BrowserRouter } from "react-router-dom";
import Router from "@/app/Router";
import { AuthProvider } from "@/features/auth/components/AuthProvider";

function App() {
  // AuthProvider wraps everything so any component can access auth state
  // It must be inside BrowserRouter if auth functions need to use navigation
  return (
    <BrowserRouter>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
