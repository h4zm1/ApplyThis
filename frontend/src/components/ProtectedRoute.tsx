import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// this like authguard in angular, neeed to (manually) be wrapped arround routes in App.tsx to be in effect
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // a hook that take a snapshot of current page (contain 'pathname')

  // show nothing while checking auth status
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // redirect to login if not authenticated
  if (!isAuthenticated) {
    //save the attempt url so we can redirect to it after login
    // 'replace' tell the browser don't add /login as new step, and replace current page with /login (prevent infinite back button bug)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
