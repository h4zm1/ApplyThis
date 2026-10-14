import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";
import api from "../services/api";
import { queryClient } from "../services/queryClient";
import {
  jobsQuery,
  resumesQuery,
  sankeyQuery,
  statsQuery,
  weeklyQuery,
  weeklyStatsQuery,
} from "../services/queries";

// this will be the data and methods available to any component using 'useAuth'
interface AuthContextType {
  user: User | null; // store current user profile
  isLoading: boolean; //
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ message: string }>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  startDemo: () => Promise<void>;
}

function userFromToken(accessToken: string): User {
  // jwt use base64url, but atob() expect base64
  const base64 = accessToken
    .split(".")[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const payload = JSON.parse(atob(base64));
  return {
    userId: payload.userId,
    email: payload.email,
    isDemo: payload.demo === true,
  };
}

// create context with undefined default to catch errors if used outside the provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// provider component, manage authentication logic and state
// NOTE: destructuring: {children} tell js to look inside the incoming object and pull out the property named 'children'
// :{children:ReactNode} is type annotation, it tells ts what shape the incoming object must be
// (it must contain a key called 'children' that mtch the ReactNode type)
// it's like doing function(props){return props.children}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // on initial load, check if the user is already logged in
  // NOTE: useEffect() is to step outside react rendering loop
  // the empty array at the end tell react that the 'effect' doesn't depends on any state so it doesn't need to rerun
  // which make this happen only once durrent mounting (the first time component is created and added to the DOM)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // get user info from the token
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // atob docode base64 payload
        setUser({ userId: payload.userId, email: payload.email });
      } catch (error) {
        // if something wrong with the token, clear storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }

    // stop the loading state whether we found a token or not
    setIsLoading(false);
  }, []);

  // POST login credentials and store returned tokens
  const login = async (data: LoginRequest) => {
    const response = await api.post<AuthTokens>("/auth/login", data);
    setTokens(response.data.accessToken, response.data.refreshToken);
  };

  // create new user and automaticly log them in
  const register = async (data: RegisterRequest) => {
    const response = await api.post<{ message: string }>(
      "/auth/register",
      data,
    );
    return response.data;
  };

  // clear all local state and storage on lougout
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    queryClient.clear(); // clear endpoint catch on logout
    setUser(null);
  };

  const startDemo = async () => {
    const response = await api.post<AuthTokens>("/auth/demo");
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    const prefetches = [
      queryClient.query(statsQuery),
      queryClient.query(jobsQuery),
      queryClient.query(resumesQuery),
      queryClient.query(sankeyQuery),
      queryClient.query(weeklyQuery),
      queryClient.query(weeklyStatsQuery),
    ];
    // prefetch all queries in the list at same time
    await Promise.allSettled(prefetches);
    setTokens(response.data.accessToken, response.data.refreshToken);
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    setUser(userFromToken(accessToken));
  };

  // when we created the context at the top, react gave us a component called 'Provider'
  // it's job is to broadcast data to the components inside the covertage erea (it's children)
  // anything inside 'value' will be available to the rest of the app
  // {children} here represent every component inside the app (cause all of the app is wrapped under AuthProvider)
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user, // !! double bang, if user an object (logged in) !!user become true, if not (null (logged out)) then it !!user is false
        login,
        register,
        logout,
        setTokens,
        startDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// custom hook
// this will make any compoent easily access authentication data
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    // safety check, just incase it get called from a component not wrapped inside AuthProvider
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
