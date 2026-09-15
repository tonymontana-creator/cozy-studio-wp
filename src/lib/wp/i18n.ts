/**
 * i18n helpers.
 *
 * Emits a POT template and a matching Slovak PO file with the strings
 * introduced by the theme (block-style labels, skip link, pattern
 * category label). The PO is a starter — translators can extend it,
 * but the theme is immediately usable in SK without extra tooling.
 */

import type { SiteBrief } from "./types";

type Entry = { msgid: string; msgstr: string };

function baseEntries(textDomain: string): Entry[] {
  return [
    { msgid: "Skip to content", msgstr: "" },
    { msgid: "Soft paper", msgstr: "" },
    { msgid: "Cozy card", msgstr: "" },
    { msgid: "Cozy patterns", msgstr: "" },
    { msgid: `${textDomain} theme`, msgstr: "" },
  ];
}

const SK_TRANSLATIONS: Record<string, string> = {
  "Skip to content": "Preskočiť na obsah",
  "Soft paper": "Jemný papier",
  "Cozy card": "Útulná karta",
  "Cozy patterns": "Útulné vzory",
};

function escapePo(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function renderPo(entries: Entry[], header: string): string {
  const body = entries
    .map((e) => `msgid "${escapePo(e.msgid)}"\nmsgstr "${escapePo(e.msgstr)}"\n`)
    .join("\n");
  return `${header}\n\n${body}`;
}

function potHeader(brief: SiteBrief, textDomain: string): string {
  return `# Copyright (C) ${new Date().getFullYear()} Cozy Studio
# This file is distributed under the GPL-2.0-or-later license.
msgid ""
msgstr ""
"Project-Id-Version: ${brief.name} 1.0.0\\n"
"Report-Msgid-Bugs-To: https://github.com/cozy-studio/${textDomain}/issues\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Domain: ${textDomain}\\n"`;
}

function poHeader(brief: SiteBrief, textDomain: string, language: string): string {
  return `# Slovak translation for ${brief.name}.
# Copyright (C) ${new Date().getFullYear()} Cozy Studio
msgid ""
msgstr ""
"Project-Id-Version: ${brief.name} 1.0.0\\n"
"Language: ${language}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;\\n"
"X-Domain: ${textDomain}\\n"`;
}

export function potFile(brief: SiteBrief, textDomain: string): string {
  return renderPo(baseEntries(textDomain), potHeader(brief, textDomain));
}

export function skPoFile(brief: SiteBrief, textDomain: string): string {
  const entries = baseEntries(textDomain).map((e) => ({
    msgid: e.msgid,
    msgstr: SK_TRANSLATIONS[e.msgid] ?? "",
  }));
  return renderPo(entries, poHeader(brief, textDomain, "sk_SK"));
}
