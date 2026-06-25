import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Trash2, Upload, Loader2, Save, X } from "lucide-react";
import {
  listPrints,
  createPrint,
  updatePrint,
  deletePrint,
} from "@/lib/prints.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Gerenciar Estampas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SHIRT_COLORS = ["White", "Black", "Brown", "Off-White"] as const;
type ShirtColor = (typeof SHIRT_COLORS)[number];

function AdminPage() {
  const list = useServerFn(listPrints);
  const create = useServerFn(createPrint);
  const update = useServerFn(updatePrint);
  const remove = useServerFn(deletePrint);
  const qc = useQueryClient();

  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(100);
  const [compatibleColors, setCompatibleColors] = useState<ShirtColor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prints"],
    queryFn: () => list(),
  });

  const prints = data?.prints ?? [];

  const resetForm = () => {
    setName("");
    setFile(null);
    setScale(100);
    setCompatibleColors([]);
    setEditingId(null);
    setEditingName("");
    const el = document.getElementById("file-input") as HTMLInputElement | null;
    if (el) el.value = "";
  };

  const startEdit = (p: { id: string; name: string; scale: number; compatible_colors?: string[] | null }) => {
    setEditingId(p.id);
    setEditingName(p.name);
    setName(p.name);
    setScale(p.scale ?? 100);
    setCompatibleColors(
      (p.compatible_colors ?? []).filter((c): c is ShirtColor =>
        (SHIRT_COLORS as readonly string[]).includes(c),
      ),
    );
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const toggleColor = (c: ShirtColor) => {
    setCompatibleColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !name) {
      setError("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const payload: {
          password: string;
          id: string;
          name: string;
          scale: number;
          compatibleColors: ShirtColor[];
          fileName?: string;
          fileBase64?: string;
          contentType?: string;
        } = { password, id: editingId, name, scale, compatibleColors };
        if (file) {
          payload.fileBase64 = await fileToBase64(file);
          payload.fileName = file.name;
          payload.contentType = file.type || "image/png";
        }
        await update({ data: payload });
        setSuccess(`Estampa "${name}" atualizada!`);
      } else {
        if (!file) {
          setError("Selecione um arquivo");
          setSubmitting(false);
          return;
        }
        const fileBase64 = await fileToBase64(file);
        await create({
          data: {
            password,
            name,
            fileName: file.name,
            fileBase64,
            contentType: file.type || "image/png",
            scale,
            compatibleColors,
          },
        });
        setSuccess(`Estampa "${name}" adicionada!`);
      }
      resetForm();
      qc.invalidateQueries({ queryKey: ["prints"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, printName: string) => {
    e.stopPropagation();
    if (!password) {
      setError("Digite a senha primeiro");
      return;
    }
    if (!confirm(`Excluir "${printName}"?`)) return;

    setError(null);
    try {
      await remove({ data: { password, id } });
      if (editingId === id) resetForm();
      qc.invalidateQueries({ queryKey: ["prints"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const isEditing = editingId !== null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-medium mb-8">
          Painel de Estampas
        </h1>

        <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant mb-8 sticky top-4 z-20 shadow-md">
          <h2 className="font-display text-xl mb-4">
            {isEditing ? `Editando Estampa: ${editingName}` : "Adicionar nova estampa"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Senha de admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome da estampa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low"
                placeholder="DTF 150 - Nome da estampa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isEditing
                  ? "Substituir imagem (opcional)"
                  : "Arquivo de imagem (PNG recomendado)"}
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {isEditing && (
                <p className="text-xs text-secondary mt-1">
                  Deixe em branco para manter a imagem atual.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tamanho da Estampa: <span className="text-secondary">{scale}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={120}
                step={1}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Cores de camiseta compatíveis
              </label>
              <p className="text-xs text-secondary mb-2">
                Marque as cores em que esta estampa pode ser aplicada. Se nenhuma for marcada, a estampa será tratada como <strong>Universal</strong> e aparecerá em todas as cores.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SHIRT_COLORS.map((c) => {
                  const checked = compatibleColors.includes(c);
                  return (
                    <label
                      key={c}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                        checked ? "border-primary bg-primary/10" : "border-surface-variant bg-surface-container-low hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColor(c)}
                        className="accent-primary"
                      />
                      {c}
                    </label>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                {success}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-primary text-on-primary text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {submitting
                  ? "Enviando..."
                  : isEditing
                    ? "Salvar Alterações"
                    : "Adicionar"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 py-2 px-5 rounded-full border border-surface-variant text-sm font-semibold uppercase tracking-wider hover:bg-surface-container-low transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant">
          <h2 className="font-display text-xl mb-4">
            Estampas cadastradas ({prints.length})
          </h2>
          {isLoading ? (
            <p className="text-sm text-secondary">Carregando...</p>
          ) : (
            <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {prints.map((p) => {
                const selected = editingId === p.id;
                return (
                  <li
                    key={p.id}
                    onClick={() => startEdit(p)}
                    className={`bg-surface-container-low rounded-md p-1.5 border flex flex-col gap-1 cursor-pointer transition hover:border-primary ${selected ? "border-primary ring-2 ring-primary" : "border-surface-variant"}`}
                  >
                    <div className="aspect-square bg-white rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] font-medium line-clamp-1 leading-tight">{p.name}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-secondary">{p.scale ?? 100}%</span>
                      <button
                        onClick={(e) => handleDelete(e, p.id, p.name)}
                        className="text-red-600 hover:text-red-800 p-0.5"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
