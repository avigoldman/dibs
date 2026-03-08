import type { CheckResult } from "./types";

export async function checkDockerHub(name: string): Promise<CheckResult> {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const profileUrl = `https://hub.docker.com/u/${slug}`;

  // Check both official image namespace and org/user namespace
  const [libRes, orgRes] = await Promise.all([
    fetch(`https://hub.docker.com/v2/repositories/library/${slug}/`, { redirect: "manual" }),
    fetch(`https://hub.docker.com/v2/orgs/${slug}/`, { redirect: "manual" }),
  ]);

  const available = libRes.status === 404 && orgRes.status === 404;

  if (available) {
    return { platform: "Docker Hub", status: "available", url: profileUrl };
  }
  return { platform: "Docker Hub", status: "taken", url: profileUrl };
}
