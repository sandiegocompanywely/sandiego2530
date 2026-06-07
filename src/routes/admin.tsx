import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Trash2, Upload, Loader2 } from "lucide-react";
import {
  listPrints,
  createPrint,
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

function AdminPage() {
  const list = useServerFn(listPrints);
  const create = useServerFn(createPrint);
  const remove = useServerFn(deletePrint);
  const qc = useQueryClient();

  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prints"],
    queryFn: () => list(),
  });

  const prints = data?.prints ?? [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !name || !file) {
      setError("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      const fileBase64 = await fileToBase64(file);
      await create({
        data: {
          password,
          name,
          fileName: file.name,
          fileBase64,
          contentType: file.type || "image/png",
          scale,
        },
      });
      setSuccess(`Estampa "${name}" adicionada!`);
      setName("");
      setFile(null);
      setScale(100);
      (document.getElementById("file-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("file-input") as HTMLInputElement).value = "");
      qc.invalidateQueries({ queryKey: ["prints"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, printName: string) => {
    if (!password) {
      setError("Digite a senha primeiro");
      return;
    }
    if (!confirm(`Excluir "${printName}"?`)) return;

    setError(null);
    try {
      await remove({ data: { password, id } });
      qc.invalidateQueries({ queryKey: ["prints"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-medium mb-8">
          Painel de Estampas
        </h1>

        <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant mb-8">
          <h2 className="font-display text-xl mb-4">Adicionar nova estampa</h2>
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
                Arquivo de imagem (PNG recomendado)
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
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

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-primary text-on-primary text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {submitting ? "Enviando..." : "Adicionar"}
            </button>
          </form>
        </section>

        <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant">
          <h2 className="font-display text-xl mb-4">
            Estampas cadastradas ({prints.length})
          </h2>
          {isLoading ? (
            <p className="text-sm text-secondary">Carregando...</p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {prints.map((p) => (
                <li
                  key={p.id}
                  className="bg-surface-container-low rounded-lg p-3 border border-surface-variant flex flex-col gap-2"
                >
                  <div className="aspect-square bg-white rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{p.name}</p>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 self-start"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
