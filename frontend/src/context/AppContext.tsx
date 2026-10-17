import { type ReactNode, createContext, useContext, useState } from "react";

interface ActionContextType {
  PreviewAction: { run: () => void } | null;
  setPreviewAction: (action: { run: () => void } | null) => void;
  CompileAndSaveAction: { run: () => void } | null;
  setCompileAndSaveAction: (action: { run: () => void } | null) => void;
  syncStatus: number | null;
  setSyncStatus: (data: number | null) => void;
  saveStatus: string | null;
  setSaveStatus: (data: string | null) => void;
  zoomInAction: { run: () => void } | null;
  setZoomInAction: (action: { run: () => void } | null) => void;
  zoomOutAction: { run: () => void } | null;
  setZoomOutAction: (action: { run: () => void } | null) => void;
  isCompiling: boolean;
  setIsCompiling: (val: boolean) => void;
  headerTitle: string | null;
  setHeaderTitle: (data: string | null) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [PreviewAction, setPreviewAction] = useState<{
    run: () => void;
  } | null>(null);
  const [CompileAndSaveAction, setCompileAndSaveAction] = useState<{
    run: () => void;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<number | null>(-1);
  const [saveStatus, setSaveStatus] = useState<string | null>("");
  const [zoomInAction, setZoomInAction] = useState<{
    run: () => void;
  } | null>(null);
  const [zoomOutAction, setZoomOutAction] = useState<{
    run: () => void;
  } | null>(null);

  const [isCompiling, setIsCompiling] = useState(false);

  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  return (
    <ActionContext.Provider
      value={{
        PreviewAction,
        setPreviewAction,
        isCompiling,
        setIsCompiling,
        CompileAndSaveAction,
        setCompileAndSaveAction,
        syncStatus,
        setSyncStatus,
        saveStatus,
        setSaveStatus,
        zoomInAction,
        setZoomInAction,
        zoomOutAction,
        setZoomOutAction,
        headerTitle,
        setHeaderTitle,
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
