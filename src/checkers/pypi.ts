import type { CheckResult } from "./types.js";

export async function checkPyPI(name: string): Promise<CheckResult> {
  const url = `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;
  const pkgUrl = `https://pypi.org/project/${name}/`;
  const res = await fetch(url);

  if (res.status === 404) {
    return { platform: "PyPI", status: "available", url: pkgUrl };
  }
  return { platform: "PyPI", status: "taken", url: pkgUrl };
}
