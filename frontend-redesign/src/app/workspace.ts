import { createContext, useContext } from "react";
import type { Destination, User } from "./model";

export interface Workspace {
  user: User;
  destinations: Destination[];
  partner: string | null;
  scopeStatus: "loading" | "error" | "ready";
  retryScope: () => void;
  partners: { code: string; name: string }[];
}

export const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Workspace provider is missing");
  return workspace;
}
