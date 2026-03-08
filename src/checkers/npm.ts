import type { CheckResult } from "./types";
import npmName from "npm-name";

export async function checkNpm(name: string): Promise<CheckResult> {
  const url = `https://www.npmjs.com/package/${name}`;
  const available = await npmName(name);

  return {
    platform: "npm",
    status: available ? "available" : "taken",
    url,
  };
}
