import type { CheckResult } from "./types.js";

export async function checkGoPkg(name: string): Promise<CheckResult> {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const searchUrl = `https://pkg.go.dev/search?q=${encodeURIComponent(name)}`;

  // Check common GitHub-based Go module paths
  const urls = [
    `https://pkg.go.dev/github.com/${slug}/${slug}`,
    `https://pkg.go.dev/github.com/${slug}`,
  ];

  const results = await Promise.all(urls.map((u) => fetch(u, { redirect: "manual" })));

  // 404 = not found, 400 = bad module path (also means not found)
  const allMissing = results.every((r: Response) => r.status === 404 || r.status === 400);

  if (allMissing) {
    return { platform: "Go (pkg.go.dev)", status: "available", url: searchUrl };
  }
  return { platform: "Go (pkg.go.dev)", status: "taken", url: searchUrl };
}
