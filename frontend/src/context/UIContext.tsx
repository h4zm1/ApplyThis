import { type ReactNode, createContext, useContext, useState } from "react";

interface UIContextType {
  recentResume: string;
  setRecentResume: (val: string) => void;
  recentResumeName: string;
  setRecentResumeName: (val: string) => void;
  accentColor: string;
  setAccentColor: (val: string) => void;
  staleCount: number;
  setStaleCount: (val: number) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [recentResume, setRecentResume] = useState("");
  const [recentResumeName, setRecentResumeName] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [staleCount, setStaleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  return (
    <UIContext.Provider
      value={{
        recentResume,
        setRecentResume,
        recentResumeName,
        setRecentResumeName,
        accentColor,
        setAccentColor,
        staleCount,
        setStaleCount,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export const useUIContext = () => {
  const context = useContext(UIContext);

  // ts keep complaining about "undefined" in Editor.tsx when calling useAction()
  // after this check it guarantee that setAction is NOT undefined
  if (context === undefined)
    throw new Error("useAction must be used within an ActionProvider");
  return context;
};
