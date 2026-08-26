import { imageStore } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const entry = await imageStore().getWithMetadata(key.join("/"), { type: "blob", consistency: "strong" });
  if (!entry) return new Response("Not found", { status: 404 });
  return new Response(entry.data, {
    headers: {
      "content-type": String(entry.metadata.contentType ?? entry.data.type ?? "application/octet-stream"),
      "cache-control": "public, max-age=31536000, immutable",
      ...(entry.etag ? { etag: entry.etag } : {}),
    },
  });
}
