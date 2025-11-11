"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type AgentStepStatus = "in-progress" | "done" | "error" | "skipped";

interface AgentStep {
  label: string;
  status: AgentStepStatus;
  detail?: string;
  durationMs?: number;
}

interface AgentResponse {
  success: true;
  prompt: string;
  imageDataUri: string;
  caption: string;
  hashtags: string[];
  altText: string;
  blueprint: {
    artDirection: string;
    callToAction?: string | null;
  };
  instagram:
    | {
        status: "published";
        creationId: string;
        mediaId: string | null;
      }
    | { status: "skipped" | "failed"; reason: string };
  steps: AgentStep[];
  warnings: string[];
  meta: {
    durationMs: number;
    generatedAt: string;
    model: string;
  };
}

const FIGURE_STYLES = [
  "Digital painting dengan tekstur halus",
  "Sketsa pensil line-art",
  "Ilustrasi guache kontemporer",
  "Vector pop art futuristik",
  "Lukisan minyak klasik",
  "Realistis sinematik",
];

const VIBES = [
  "Tenang dan introspektif",
  "Dinamis penuh energi",
  "Misterius dan dramatis",
  "Romantis hangat",
  "Editorial high-fashion",
];

const LIGHTING_PRESETS = [
  "Soft daylight",
  "Rim light dramatis",
  "Studio lighting three-point",
  "Golden hour backlight",
  "Monokrom kontras tinggi",
];

const TONES = [
  "Storyteller humanis",
  "Art director profesional",
  "Motivational coach",
  "Intimate first-person",
  "Humor ringan",
];

const DEFAULT_FORM = {
  concept:
    "Potret perempuan muda sedang duduk dengan pose 3/4, fokus pada gestur tangan yang menggambar.",
  style: FIGURE_STYLES[0],
  vibe: VIBES[0],
  pose: "Pose santai duduk 3/4, bahu rileks",
  lighting: LIGHTING_PRESETS[0],
  colorPalette: "Palet pastel dengan aksen terracotta",
  reference:
    "Referensi anatomi klasik, finishing brush stroke impresionistik",
  callToAction: "Follow untuk kelas menggambar manusia terbaru",
  hashtags:
    "figure drawing, humansketch, portraitstudy, digitalart, artistsoninstagram",
  captionTone: TONES[0],
  autoUpload: false,
  language: "id-ID",
};

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,#]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 25);
}

function formatDuration(ms?: number) {
  if (!ms && ms !== 0) return "";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} dtk`;
}

function StatusBadge({ status }: { status: AgentStepStatus }) {
  const palette: Record<AgentStepStatus, string> = {
    "in-progress": "bg-blue-500/15 text-blue-300 border border-blue-400/40",
    done: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40",
    error: "bg-rose-500/15 text-rose-300 border border-rose-400/40",
    skipped: "bg-slate-500/10 text-slate-300 border border-slate-400/30",
  };

  const label: Record<AgentStepStatus, string> = {
    "in-progress": "Sedang jalan",
    done: "Selesai",
    error: "Gagal",
    skipped: "Lewati",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette[status]}`}>
      {label[status]}
    </span>
  );
}

export default function Home() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      setError(null);
      setCopied(false);
      setResult(null);
      setSteps([
        { label: "Menafsirkan brief", status: "in-progress" },
        { label: "Merender karya", status: "in-progress" },
      ]);

      try {
        const payload = {
          concept: form.concept,
          style: form.style,
          vibe: form.vibe,
          pose: form.pose,
          lighting: form.lighting,
          colorPalette: form.colorPalette,
          reference: form.reference,
          callToAction: form.callToAction,
          language: form.language,
          instagram: {
            captionTone: form.captionTone,
            hashtags: parseHashtags(form.hashtags),
            autoUpload: form.autoUpload,
          },
        };

        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Gagal menjalankan agen.");
        }

        const data = (await response.json()) as AgentResponse;
        setResult(data);
        setSteps(data.steps);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(message);
        setSteps((prev) =>
          prev.map((step, index) =>
            index === prev.length - 1
              ? { ...step, status: "error", detail: message }
              : step
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  const activeSteps = result?.steps ?? steps;

  const copyCaption = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Browser menolak akses clipboard."
      );
    }
  }, [result]);

  const downloadImage = useCallback(() => {
    if (!result) return;
    const anchor = document.createElement("a");
    anchor.href = result.imageDataUri;
    anchor.download = `human-muse-${Date.now()}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [result]);

  const instagramStatus = useMemo(() => {
    if (!result) return null;
    if (result.instagram.status === "published") {
      return `Berhasil terbit (media ID: ${result.instagram.mediaId ?? "?"}).`;
    }
    return result.instagram.reason;
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <section className="w-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/60 backdrop-blur lg:w-[420px]">
          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              <SparklesIcon className="h-4 w-4" />
              Human Muse Agent
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-slate-50">
              Satu klik: gambar manusia + caption Instagram siap tayang.
            </h1>
            <p className="text-sm text-slate-300">
              Agen ini menyusun prompt, merender gambar dengan model AI, menulis
              caption, lalu mengunggah otomatis ke Instagram Business / Creator
              Anda.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Konsep manusia yang ingin digambar
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                value={form.concept}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, concept: event.target.value }))
                }
                placeholder="Ceritakan siapa, pose, interaksi, props, mood messagenya"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Gaya</label>
                <select
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  value={form.style}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, style: event.target.value }))
                  }
                >
                  {FIGURE_STYLES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mood</label>
                <select
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  value={form.vibe}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, vibe: event.target.value }))
                  }
                >
                  {VIBES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pose / gestur</label>
                <input
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  value={form.pose}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, pose: event.target.value }))
                  }
                  placeholder="Contoh: Kontak mata dengan penonton"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pencahayaan</label>
                <select
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  value={form.lighting}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, lighting: event.target.value }))
                  }
                >
                  {LIGHTING_PRESETS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Palet warna</label>
              <input
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                value={form.colorPalette}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    colorPalette: event.target.value,
                  }))
                }
                placeholder="Contoh: Earth tone + aksen cyan neon"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan referensi</label>
              <textarea
                className="min-h-[90px] w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                value={form.reference}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, reference: event.target.value }))
                }
                placeholder="Tambahkan referensi seniman, suasana kamera, dsb"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hashtag (maks 25)</label>
              <input
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                value={form.hashtags}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hashtags: event.target.value }))
                }
                placeholder="Pisahkan dengan koma atau spasi"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nada caption</label>
              <select
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                value={form.captionTone}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    captionTone: event.target.value,
                  }))
                }
              >
                {TONES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ajakan bertindak</label>
              <input
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                value={form.callToAction}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    callToAction: event.target.value,
                  }))
                }
                placeholder="Contoh: Join workshop mingguan"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  Upload otomatis ke Instagram
                </p>
                <p className="text-xs text-slate-400">
                  Butuh INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.autoUpload}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      autoUpload: event.target.checked,
                    }))
                  }
                />
                <div className="h-6 w-11 rounded-full bg-slate-700/70 transition peer-checked:bg-blue-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {loading ? "Menjalankan agen..." : "Generate & Publish"}
            </button>

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Gagal menjalankan agen</p>
                  <p className="text-rose-100/70">{error}</p>
                </div>
              </div>
            ) : null}
          </form>
        </section>

        <section className="flex-1 space-y-6">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-7 backdrop-blur">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Status Agen
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50">
                  Pipeline kreatif & distribusi
                </h2>
              </div>
              <CloudArrowUpIcon className="h-8 w-8 text-blue-300/70" />
            </header>

            <ol className="mt-6 space-y-4">
              {activeSteps.map((step) => (
                <li
                  key={`${step.label}-${step.detail ?? ""}`}
                  className="rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {step.label}
                      </p>
                      {step.detail ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {step.detail}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <StatusBadge status={step.status} />
                      {step.durationMs !== undefined ? (
                        <span className="text-[11px] text-slate-500">
                          {formatDuration(step.durationMs)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {result ? (
              <div className="mt-6 grid gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckIcon className="h-4 w-4" />
                  Pipeline sukses dalam {formatDuration(result.meta.durationMs)}
                </div>
                {instagramStatus ? <p>{instagramStatus}</p> : null}
                <p className="text-emerald-100/80">
                  Model: {result.meta.model}
                </p>
              </div>
            ) : null}

            {result?.warnings?.length ? (
              <div className="mt-4 space-y-2 text-xs text-amber-200">
                {result.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {result ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-50">
                      Caption & copy
                    </h3>
                    <p className="text-xs text-slate-400">
                      Otomatis termasuk hashtag & CTA.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCaption}
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-500/60 hover:text-blue-200"
                  >
                    {copied ? (
                      <ClipboardDocumentCheckIcon className="h-4 w-4" />
                    ) : (
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                    )}
                    {copied ? "Disalin" : "Salin"}
                  </button>
                </div>

                <article className="space-y-4 whitespace-pre-wrap rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm leading-relaxed text-slate-100">
                  {result.caption}
                </article>

                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 text-xs text-slate-300">
                  <p className="font-semibold text-slate-200">Prompt render</p>
                  <p className="mt-2 whitespace-pre-line text-slate-400">
                    {result.prompt}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-50">
                      Preview Instagram
                    </h3>
                    <p className="text-xs text-slate-400">
                      Termasuk alt text dan metadata publikasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-500/60 hover:text-blue-200"
                  >
                    <CloudArrowDownIcon className="h-4 w-4" />
                    Unduh PNG
                  </button>
                </div>

                <figure className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.imageDataUri}
                    alt={result.altText}
                    className="aspect-square w-full object-cover"
                  />
                </figure>

                <dl className="grid gap-3 text-xs text-slate-300">
                  <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <dt className="font-semibold text-slate-200">Alt text</dt>
                    <dd className="mt-1 text-slate-400">{result.altText}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <dt className="font-semibold text-slate-200">Hashtag</dt>
                    <dd className="mt-1 text-slate-400">
                      {result.hashtags.join(" ")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800/60 bg-slate-900/20 p-16 text-center text-slate-500">
              <p className="text-sm">Hasil akan muncul di sini setelah agen selesai.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
