// The architectures THUMDER simulates, and what each one shows. Pure TypeScript: the Web Worker, the configuration and
// the views use it. A new architecture is added here (its name, its views), with its engine in simulator.ts (ENGINES)
// and its configuration in config.ts.

export type ArchitectureId = "dlx" | "superdlx";

/** The views of the machine (the keys of the multiview) */
export type MachineView = "pipeline" | "cycle_clock_diagram" | "datapath" | "registers" | "memory" | "code" | "statistics";

export type ArchitectureInfo = {
  id: ArchitectureId;
  /** Its name, the same in every language */
  name: string;
  /** What it is, in one sentence (a key of the translations) */
  summary: string;
  icon: string;
  /** The views it has: the others are hidden while it is the one chosen */
  views: readonly MachineView[];
};

const ALL_VIEWS: readonly MachineView[] = ["pipeline", "cycle_clock_diagram", "datapath", "registers", "memory", "code", "statistics"];

export const ARCHITECTURES: readonly ArchitectureInfo[] = [
  { id: "dlx", name: "DLX", summary: "ARCH.DLX_SUMMARY", icon: "fas fa-stream", views: ALL_VIEWS },
  {
    id: "superdlx",
    name: "SuperDLX",
    summary: "ARCH.SUPERDLX_SUMMARY",
    icon: "fas fa-layer-group",
    views: ALL_VIEWS.filter((view) => view !== "datapath"),
  },
];

export const DEFAULT_ARCHITECTURE: ArchitectureId = "dlx";

export function isArchitecture(value: unknown): value is ArchitectureId {
  return ARCHITECTURES.some((architecture) => architecture.id === value);
}

export function architectureOf(id: ArchitectureId): ArchitectureInfo {
  return ARCHITECTURES.find((architecture) => architecture.id === id) ?? ARCHITECTURES[0];
}

/** Whether a view (a key of the multiview, or another one) is shown with an architecture: the views that are not of the
 * machine (the calculator...) always are */
export function showsView(id: ArchitectureId, view: string): boolean {
  return !ALL_VIEWS.includes(view as MachineView) || architectureOf(id).views.includes(view as MachineView);
}
