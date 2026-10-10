/** Geração de calendário iCalendar (RFC 5545) para exportação da agenda (M3). */
export type EventoIcs = {
  uid: string;
  inicio: string; // ISO
  fim?: string | null;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  url?: string | null;
  alarmesMinutos?: number[];
};

function dataIcs(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapar(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Dobra linhas em 75 octetos (aproximação por caracteres). */
function dobrar(linha: string): string {
  const partes: string[] = [];
  let resto = linha;
  while (resto.length > 74) {
    partes.push(resto.slice(0, 74));
    resto = " " + resto.slice(74);
  }
  partes.push(resto);
  return partes.join("\r\n");
}

export function gerarIcs(nomeCalendario: string, eventos: EventoIcs[]): string {
  const agora = dataIcs(new Date().toISOString());
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gestao Juridica//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapar(nomeCalendario)}`,
  ];
  for (const e of eventos) {
    const fim = e.fim || new Date(new Date(e.inicio).getTime() + 60 * 60 * 1000).toISOString();
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${agora}`,
      `DTSTART:${dataIcs(e.inicio)}`,
      `DTEND:${dataIcs(fim)}`,
      `SUMMARY:${escapar(e.titulo)}`,
    );
    if (e.descricao) linhas.push(`DESCRIPTION:${escapar(e.descricao)}`);
    if (e.local) linhas.push(`LOCATION:${escapar(e.local)}`);
    if (e.url) linhas.push(`URL:${e.url}`);
    for (const m of e.alarmesMinutos ?? []) {
      linhas.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapar(e.titulo)}`, `TRIGGER:-PT${m}M`, "END:VALARM");
    }
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
