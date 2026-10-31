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
  minSub: number;
  setMinSub: (val: number) => void;
  minPrime: number;
  setMinPrime: (val: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [recentResume, setRecentResume] = useState("");
  const [recentResumeName, setRecentResumeName] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [staleCount, setStaleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [minSub, setMinSub] = useState(0);
  const [minPrime, setMinPrime] = useState(0);
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
        minSub,
        setMinSub,
        minPrime,
        setMinPrime,
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
