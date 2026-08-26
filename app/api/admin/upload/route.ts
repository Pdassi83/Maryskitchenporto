import { requestIsAdmin, unauthorized } from "@/lib/admin-auth";
import { imageStore } from "@/lib/storage";

export async function POST(request: Request) {
  if (!requestIsAdmin(request)) return unauthorized();
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Escolhe uma imagem." }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "O ficheiro tem de ser uma imagem." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: "A imagem não pode ultrapassar 5 MB." }, { status: 400 });

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `dishes/${crypto.randomUUID()}.${extension}`;
    await imageStore().set(key, await file.arrayBuffer(), {
      metadata: { contentType: file.type, originalName: file.name.slice(0, 120) },
    });
    return Response.json({ image: `/api/images/${key}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível enviar a imagem." }, { status: 500 });
  }
}
