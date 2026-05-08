import { create } from "zustand";

export type Route =
  | "cover"
  | "cases"
  | "caseDetail"
  | "graph"
  | "timeline"
  | "reports"
  | "settings";

type RouterState = {
  route: Route;
  caseId: string | null;
  setRoute: (r: Route) => void;
  openCase: (id: string) => void;
};

export const useRouter = create<RouterState>((set) => ({
  route: "cover",
  caseId: null,
  setRoute: (route) => set({ route }),
  openCase: (id) => set({ route: "caseDetail", caseId: id }),
}));
