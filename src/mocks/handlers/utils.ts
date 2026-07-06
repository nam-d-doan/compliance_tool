import { delay, HttpResponse, type JsonBodyType } from "msw";

export type MockResolverContext = {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
  cookies?: Record<string, string | undefined>;
};

export async function getDelay(min = 200, max = 500): Promise<void> {
  await delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function jsonResponse(data: unknown, status = 200): Response {
  return HttpResponse.json(data as JsonBodyType, { status });
}

export function badRequest(message: string): Response {
  return HttpResponse.json({ success: false, message }, { status: 400 });
}

export function notFound(message = "Not found"): Response {
  return HttpResponse.json({ success: false, message }, { status: 404 });
}

export function parseQuery(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function parseNumber(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function normalizeArrayParam(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
