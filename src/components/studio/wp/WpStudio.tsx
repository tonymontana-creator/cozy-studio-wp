import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Eye, FileText, PaintBucket, ShieldCheck, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bundleThemeZip,
  generateWpTheme,
  listDesignPresets,
  type WpTheme,
} from "@/lib/wp";
import { downloadZip } from "@/lib/wp/zip";

const DEFAULT_BRIEF = `Kaviareň Zrno na Michalskej v Bratislave. Poctivá espresso káva a denné pečivo, tiché miesto na prácu. Otvorené každý deň okrem nedele. Kontakt: hello@zrno.example, +421 900 123 456.`;

const PRESETS = listDesignPresets();

type Panel = "preview" | "files" | "audit";

/**
 * WordPress FSE studio.
 *
 * A parallel workflow to the classic Cozy Studio: user writes a brief,
 * picks a design preset, sees a live multi-page HTML preview (rendered
 * from the same tokens the theme.json produces), and downloads a fully
 * installable FSE theme ZIP. Everything runs client-side — no AI key
 * required to generate the base theme.
 */
export function WpStudio() {
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [presetId, setPresetId] = useState<string>("warm-paper");
  const [customPrimary, setCustomPrimary] = useState<string>("");
  const [radius, setRadius] = useState<number | "">("");
  const [panel, setPanel] = useState<Panel>("preview");
  const [activePage, setActivePage] = useState<string>("home");
  const [activeFile, setActiveFile] = useState<string>("theme.json");

  const theme: WpTheme = useMemo(() => {
    return generateWpTheme(brief, {
      designPresetId: presetId,
      customDesign: {
        palette: customPrimary
          ? {
              ...PRESETS.find((p) => p.id === presetId)!.palette,
              primary: customPrimary,
            }
          : undefined,
        radius: typeof radius === "number" ? radius : undefined,
      },
    });
  }, [brief, presetId, customPrimary, radius]);

  const currentFile = useMemo(() => {
    return theme.files.find((f) => f.path === activeFile) ?? theme.files[0]!;
  }, [theme.files, activeFile]);

  const pageIframeSrc = useMemo(() => {
    return `data:text/html;charset=utf-8,${encodeURIComponent(withActivePage(theme.previewHtml, activePage))}`;
  }, [theme.previewHtml, activePage]);

  function onDownload() {
    const blob = bundleThemeZip(theme);
    downloadZip(theme.slug, blob);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 bg-[#f4efe6] p-3 text-[#1c1915] md:p-6">
      <header className="flex flex-col gap-2 border-b border-[#e2d8c7] pb-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-[#a94628]" />
          <h1 className="font-serif text-xl md:text-2xl">Cozy Studio · WordPress FSE</h1>
          <span className="rounded-full border border-[#e2d8c7] bg-[#faf6ee] px-2 py-0.5 text-xs text-[#5b5147]">
            Generuje hotové WP témy z briefu
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/studio"
            className="rounded-md border border-[#e2d8c7] bg-[#faf6ee] px-3 py-1.5 text-sm hover:bg-[#f4efe6]"
          >
            ← Klasické Studio
          </Link>
          <Button onClick={onDownload} className="gap-2 bg-[#a94628] hover:bg-[#8a3720]">
            <Download className="size-4" /> Stiahnuť ZIP tému
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Left column: brief + design system */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-[#e2d8c7] bg-[#faf6ee] p-4 shadow-sm">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-[#5b5147]" /> Brief pre stránku
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={7}
              className="w-full resize-y rounded-md border border-[#e2d8c7] bg-white p-2 text-sm leading-relaxed"
              placeholder="Napíšte 2–4 vety o webe: názov, čo robí, kontakt."
            />
            <p className="mt-2 text-xs text-[#5b5147]">
              Detekcia SK/EN a typu stránky (kaviareň, portfólio, obchod, blog…) je automatická.
            </p>
          </section>

          <section className="rounded-xl border border-[#e2d8c7] bg-[#faf6ee] p-4 shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium">
              <PaintBucket className="size-4 text-[#5b5147]" /> Návrhový systém
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  className={`group flex flex-col items-stretch overflow-hidden rounded-md border transition ${
                    presetId === p.id ? "border-[#a94628] ring-2 ring-[#a94628]/40" : "border-[#e2d8c7]"
                  }`}
                  title={p.label}
                  type="button"
                >
                  <span className="flex h-8">
                    <span className="flex-1" style={{ background: p.palette.background }} />
                    <span className="flex-1" style={{ background: p.palette.primary }} />
                    <span className="flex-1" style={{ background: p.palette.accent }} />
                  </span>
                  <span className="truncate bg-white px-1 py-1 text-[10px] text-[#1c1915]">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-[#5b5147]">Vlastná primárna farba</label>
                <input
                  type="color"
                  value={customPrimary || theme.design.palette.primary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-8 w-14 cursor-pointer rounded border border-[#e2d8c7]"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-[#5b5147]">Zaoblenie (radius, px)</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={radius === "" ? theme.design.radius : radius}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRadius(v === "" ? "" : Math.max(0, Math.min(24, Number(v))));
                  }}
                  className="w-20 rounded border border-[#e2d8c7] bg-white px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5b5147]">
                <Type className="size-3.5" />
                <span>
                  {theme.design.typography.headingFamily} · {theme.design.typography.bodyFamily}
                </span>
              </div>
            </div>
          </section>

          <AuditCard theme={theme} />
        </aside>

        {/* Right column: preview + files + audit tabs */}
        <main className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2d8c7] bg-[#faf6ee] px-3 py-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-1">
              {theme.pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePage(p.id)}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    activePage === p.id
                      ? "bg-[#a94628] text-white"
                      : "text-[#1c1915] hover:bg-[#f4efe6]"
                  }`}
                  type="button"
                >
                  {p.title}
                </button>
              ))}
            </div>
            <nav className="flex items-center gap-1 rounded-md border border-[#e2d8c7] bg-white p-0.5 text-sm">
              <TabButton active={panel === "preview"} onClick={() => setPanel("preview")}>
                <Eye className="size-3.5" /> Náhľad
              </TabButton>
              <TabButton active={panel === "files"} onClick={() => setPanel("files")}>
                <FileText className="size-3.5" /> Súbory ({theme.files.length})
              </TabButton>
              <TabButton active={panel === "audit"} onClick={() => setPanel("audit")}>
                <ShieldCheck className="size-3.5" /> Audit
              </TabButton>
            </nav>
          </div>

          <section className="min-h-[600px] overflow-hidden rounded-xl border border-[#e2d8c7] bg-white shadow-sm">
            {panel === "preview" && (
              <iframe
                title={`${theme.name} preview`}
                src={pageIframeSrc}
                sandbox="allow-scripts"
                className="h-[70vh] w-full border-0"
              />
            )}
            {panel === "files" && (
              <div className="grid h-[70vh] grid-cols-[260px_1fr]">
                <ul className="overflow-y-auto border-r border-[#e2d8c7] bg-[#faf6ee] py-2 text-sm">
                  {theme.files.map((f) => (
                    <li key={f.path}>
                      <button
                        onClick={() => setActiveFile(f.path)}
                        className={`block w-full truncate px-3 py-1 text-left font-mono text-xs transition ${
                          activeFile === f.path
                            ? "bg-[#a94628] text-white"
                            : "text-[#1c1915] hover:bg-[#f4efe6]"
                        }`}
                        type="button"
                        title={f.path}
                      >
                        {f.path}
                      </button>
                    </li>
                  ))}
                </ul>
                <pre className="m-0 h-full overflow-auto bg-[#faf6ee] p-3 font-mono text-xs leading-relaxed text-[#1c1915]">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            )}
            {panel === "audit" && <AuditPanel theme={theme} />}
          </section>
        </main>
      </div>

      <footer className="pt-2 text-xs text-[#5b5147]">
        Vygenerovaná téma: <strong className="text-[#1c1915]">{theme.name}</strong> · slug{" "}
        <code className="rounded bg-[#faf6ee] px-1">{theme.slug}</code> · verzia {theme.version} ·{" "}
        {theme.files.length} súborov · lokalizácia {theme.brief.locale.toUpperCase()}
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs transition ${
        active ? "bg-[#a94628] text-white" : "text-[#1c1915] hover:bg-[#f4efe6]"
      }`}
    >
      {children}
    </button>
  );
}

function AuditCard({ theme }: { theme: WpTheme }) {
  return (
    <section className="rounded-xl border border-[#e2d8c7] bg-[#faf6ee] p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <ShieldCheck className="size-4 text-[#5b5147]" /> Skóre
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Score label="SEO" value={theme.seo.score} />
        <Score label="Prístupnosť" value={theme.a11y.score} />
      </div>
      <p className="mt-2 text-xs text-[#5b5147]">
        Detaily nájdete v paneli <em>Audit</em>. Bloková téma sa generuje s{" "}
        <code>theme.json</code>, kontrastom AA, skip-linkom a schema.org markupom.
      </p>
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? "#2f6b3a" : value >= 70 ? "#a94628" : "#8a3720";
  return (
    <div className="flex items-center justify-between rounded-md border border-[#e2d8c7] bg-white px-3 py-2">
      <span className="text-xs text-[#5b5147]">{label}</span>
      <span className="text-lg font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function AuditPanel({ theme }: { theme: WpTheme }) {
  return (
    <div className="grid h-[70vh] grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-2">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4" /> SEO ({theme.seo.score}/100)
        </h3>
        <ul className="space-y-1 text-sm">
          {theme.seo.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span className={c.ok ? "text-[#2f6b3a]" : "text-[#a94628]"}>{c.ok ? "✓" : "!"}</span>
              <span>
                {c.label}
                {!c.ok && c.hint && (
                  <span className="ml-1 text-xs text-[#5b5147]"> — {c.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <PaintBucket className="size-4" /> Prístupnosť ({theme.a11y.score}/100)
        </h3>
        <ul className="space-y-1 text-sm">
          {theme.a11y.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span className={c.ok ? "text-[#2f6b3a]" : "text-[#a94628]"}>{c.ok ? "✓" : "!"}</span>
              <span>
                {c.label}
                {!c.ok && c.hint && (
                  <span className="ml-1 text-xs text-[#5b5147]"> — {c.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#5b5147]">
          Kontrast (WCAG)
        </h4>
        <ul className="mt-1 space-y-1 text-xs">
          {theme.a11y.contrast.map((c) => (
            <li key={c.role} className="flex items-center justify-between rounded border border-[#e2d8c7] bg-white px-2 py-1">
              <span>
                {c.role} ↔ {c.against}
              </span>
              <span className={c.ok ? "text-[#2f6b3a]" : "text-[#a94628]"}>
                {c.ratio.toFixed(2)}:1
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Rewrites the preview HTML so that the `data-active="true"` marker lives on
 * the requested page — lets the tabs in the outer UI drive the iframe without
 * postMessage plumbing.
 */
function withActivePage(html: string, pageId: string): string {
  return html
    .replace(
      /<div class="page" data-page="([^"]+)" data-active="[^"]+"/g,
      (_m, id) => `<div class="page" data-page="${id}" data-active="${id === pageId ? "true" : "false"}"`,
    )
    .replace(
      /aria-current="page"/g,
      "",
    )
    .replace(
      new RegExp(`data-target="${escapeRe(pageId)}">`, "g"),
      `data-target="${pageId}" aria-current="page">`,
    );
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
