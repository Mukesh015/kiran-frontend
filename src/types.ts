export type FlowStatus = "High" | "Normal" | "Low" | "Leak" | "No Leakage";

export interface Tank {
  id: string;              // device id
  name: string;            // tank name
  location?: string;
  currentLevel: number;  // total capacity
  capacity: number;    // current volume
  fillPercentage: number;  // 0..100
  flowNote: FlowStatus;    // leak/ok
  lastUpdatedISO: string;  // ISO timestamp
  severity?: "High" | "Normal" | "Low";
}
