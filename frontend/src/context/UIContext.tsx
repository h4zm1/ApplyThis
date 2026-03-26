import { type ReactNode, createContext, useContext, useState } from "react";

interface UIContextType {
  inResume: boolean;
  setInResume: (val: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [inResume, setInResume] = useState(false);

  return (
    <UIContext.Provider
      value={{
        inResume,
        setInResume,
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
