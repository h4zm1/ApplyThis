import { type ReactNode, createContext, useContext, useState } from "react";

interface ActionContextType {
  PreviewAction: { run: () => void } | null;
  setPreviewAction: (action: { run: () => void } | null) => void;
  CompileAndSaveAction: { run: () => void } | null;
  setCompileAndSaveAction: (action: { run: () => void } | null) => void;
  zoomInAction: { run: () => void } | null;
  setZoomInAction: (action: { run: () => void } | null) => void;
  zoomOutAction: { run: () => void } | null;
  setZoomOutAction: (action: { run: () => void } | null) => void;
  isCompiling: boolean;
  setIsCompiling: (val: boolean) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [PreviewAction, setPreviewAction] = useState<{
    run: () => void;
  } | null>(null);
  const [CompileAndSaveAction, setCompileAndSaveAction] = useState<{
    run: () => void;
  } | null>(null);
  const [zoomInAction, setZoomInAction] = useState<{
    run: () => void;
  } | null>(null);
  const [zoomOutAction, setZoomOutAction] = useState<{
    run: () => void;
  } | null>(null);

  const [isCompiling, setIsCompiling] = useState(false);

  return (
    <ActionContext.Provider
      value={{
        PreviewAction,
        setPreviewAction,
        isCompiling,
        setIsCompiling,
        CompileAndSaveAction,
        setCompileAndSaveAction,
        zoomInAction,
        setZoomInAction,
        zoomOutAction,
        setZoomOutAction,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
}

export const useAction = () => {
  const context = useContext(ActionContext);

  // ts keep complaining about "undefined" in Editor.tsx when calling useAction()
  // after this check it guarantee that setAction is NOT undefined
  if (context === undefined)
    throw new Error("useAction must be used within an ActionProvider");
  return context;
};
