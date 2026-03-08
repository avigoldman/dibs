export type CheckStatus = "available" | "taken" | "error";

export interface CheckResult {
  platform: string;
  status: CheckStatus;
  url?: string;
  message?: string;
}
