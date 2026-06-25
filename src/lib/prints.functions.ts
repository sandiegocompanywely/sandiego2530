import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listPrints = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("prints")
    .select("id, name, image_url, scale, compatible_colors")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { prints: data ?? [] };
});

const COMPATIBLE_COLORS = ["White", "Black", "Brown", "Off-White"] as const;

const createSchema = z.object({
  password: z.string().min(1),
  name: z.string().min(1).max(255),
  fileName: z.string().min(1).max(255),
  fileBase64: z.string().min(1),
  contentType: z.string().min(1).max(100),
  scale: z.number().int().min(50).max(120).default(100),
  compatibleColors: z.array(z.enum(COMPATIBLE_COLORS)).default([]),
});

export const createPrint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.password !== process.env.ADMIN_PASSWORD) {
      throw new Error("Senha incorreta");
    }

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(data.fileBase64, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from("prints")
      .upload(storagePath, buffer, {
        contentType: data.contentType,
        upsert: false,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: pub } = supabaseAdmin.storage
      .from("prints")
      .getPublicUrl(storagePath);

    const { data: row, error: insertError } = await supabaseAdmin
      .from("prints")
      .insert({
        name: data.name,
        image_url: pub.publicUrl,
        storage_path: storagePath,
        scale: data.scale,
        compatible_colors: data.compatibleColors,
      })
      .select("id, name, image_url, scale, compatible_colors")
      .single();
    if (insertError) throw new Error(insertError.message);

    return { print: row };
  });

const updateSchema = z.object({
  password: z.string().min(1),
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  scale: z.number().int().min(50).max(120),
  fileName: z.string().min(1).max(255).optional(),
  fileBase64: z.string().min(1).optional(),
  contentType: z.string().min(1).max(100).optional(),
  compatibleColors: z.array(z.enum(COMPATIBLE_COLORS)).default([]),
});

export const updatePrint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.password !== process.env.ADMIN_PASSWORD) {
      throw new Error("Senha incorreta");
    }

    const updates: {
      name: string;
      scale: number;
      image_url?: string;
      storage_path?: string;
      compatible_colors: string[];
    } = { name: data.name, scale: data.scale, compatible_colors: data.compatibleColors };

    if (data.fileBase64 && data.fileName && data.contentType) {
      const { data: existing } = await supabaseAdmin
        .from("prints")
        .select("storage_path")
        .eq("id", data.id)
        .single();

      const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${Date.now()}-${safeName}`;
      const buffer = Buffer.from(data.fileBase64, "base64");

      const { error: uploadError } = await supabaseAdmin.storage
        .from("prints")
        .upload(storagePath, buffer, {
          contentType: data.contentType,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data: pub } = supabaseAdmin.storage
        .from("prints")
        .getPublicUrl(storagePath);

      updates.image_url = pub.publicUrl;
      updates.storage_path = storagePath;

      if (existing?.storage_path) {
        await supabaseAdmin.storage
          .from("prints")
          .remove([existing.storage_path]);
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("prints")
      .update(updates)
      .eq("id", data.id)
      .select("id, name, image_url, scale")
      .single();
    if (error) throw new Error(error.message);
    return { print: row };
  });

const deleteSchema = z.object({
  password: z.string().min(1),
  id: z.string().uuid(),
});

export const deletePrint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.password !== process.env.ADMIN_PASSWORD) {
      throw new Error("Senha incorreta");
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("prints")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    if (existing?.storage_path) {
      await supabaseAdmin.storage.from("prints").remove([existing.storage_path]);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("prints")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw new Error(deleteError.message);

    return { success: true };
  });
