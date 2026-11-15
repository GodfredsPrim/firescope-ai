import Papa from "papaparse";

export type Sensor = "MODIS" | "VIIRS";
export type Observation = {
  id: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  sensor: Sensor;
  satellite: string;
  confidence: string;
  frp: number | null;
  source: string;
  synthetic?: boolean;
  metadata?: { scan?: string; track?: string; version?: string; daynight?: string };
};
export const regions = {
  ghana: { name: "Ghana study extent", bounds: [-3.3, 4.5, 1.3, 11.2] },
  northern: {
    name: "Northern Ghana study extent",
    bounds: [-3.3, 8.3, 1.3, 11.2],
  },
  tamale: { name: "Tamale study extent", bounds: [-1.4, 8.9, -0.3, 10.0] },
  custom: { name: "Requested area", bounds: [-3.3, 4.5, 1.3, 11.2] },
} as const;
export type Region = keyof typeof regions;
export function inRegion(r: Observation, region: Region, customBounds?: readonly number[]) {
  const [w, s, e, n] = region === 'custom' && customBounds ? customBounds : regions[region].bounds;
  return (
    r.longitude >= w && r.longitude <= e && r.latitude >= s && r.latitude <= n
  );
}
export function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function key(r: Omit<Observation, "id" | "source">) {
  return [r.sensor, r.satellite, r.date, r.time, r.latitude, r.longitude].join(
    "|",
  );
}
export function parseCSV(
  text: string,
  source: string,
): { records: Observation[]; rejected: number; duplicates: number } {
  const parsed = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
    },
  );
  if (parsed.errors.length)
    throw new Error(
      "The CSV is malformed. Check quoting and make sure each row matches the header.",
    );
  const fields = parsed.meta.fields ?? [];
  for (const field of ["latitude", "longitude", "acq_date", "acq_time"])
    if (!fields.includes(field))
      throw new Error(
        `Missing required column: ${field}. Import a NASA FIRMS CSV with latitude, longitude, acq_date and acq_time.`,
      );
  const records: Observation[] = [];
  const seen = new Set<string>();
  let rejected = 0,
    duplicates = 0;
  for (const row of parsed.data) {
    const latitude = Number(row.latitude),
      longitude = Number(row.longitude),
      date = row.acq_date?.trim();
    const time = (row.acq_time ?? "").trim().padStart(4, "0");
    const instrument = row.instrument?.trim().toUpperCase();
    const sensor: Sensor | undefined =
      instrument === "MODIS"
        ? "MODIS"
        : instrument === "VIIRS"
          ? "VIIRS"
          : !instrument && fields.includes("bright_ti4")
            ? "VIIRS"
            : !instrument && fields.includes("bright_t31")
              ? "MODIS"
              : undefined;
    const rawFrp = row.frp?.trim();
    const frp = rawFrp ? Number(rawFrp) : null;
    if (
      !row.latitude?.trim() ||
      !row.longitude?.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180 ||
      !validDate(date) ||
      !/^\d{4}$/.test(time) ||
      !row.acq_time?.trim() ||
      Number(time.slice(0, 2)) > 23 ||
      Number(time.slice(2)) > 59 ||
      !sensor ||
      (frp !== null && (!Number.isFinite(frp) || frp < 0))
    ) {
      rejected++;
      continue;
    }
    const base = {
      latitude,
      longitude,
      date,
      time,
      sensor,
      satellite: row.satellite?.trim() || "Not supplied",
      confidence: row.confidence?.trim() || "Not supplied",
      frp,
    };
    const id = key(base);
    if (seen.has(id)) {
      duplicates++;
      continue;
    }
    seen.add(id);
    records.push({
      ...base,
      id,
      source: row.source?.trim() || source,
      synthetic: row.dataset_kind?.trim() === "synthetic",
      metadata: { scan: row.scan?.trim(), track: row.track?.trim(), version: row.version?.trim(), daynight: row.daynight?.trim() },
    });
  }
  if (!records.length)
    throw new Error(
      `No valid observations found (${rejected} rows rejected). Check sensor columns, coordinates, dates and UTC times.`,
    );
  return { records, rejected, duplicates };
}
export function mergeRecords(current: Observation[], incoming: Observation[]) {
  const map = new Map(current.map((r) => [r.id, r]));
  let duplicates = 0;
  for (const r of incoming) {
    if (map.has(r.id)) duplicates++;
    else map.set(r.id, r);
  }
  return { records: [...map.values()], duplicates };
}
export function cellKey(r: Observation) {
  return `${Math.floor((r.longitude + 180) / 0.1)},${Math.floor((r.latitude + 90) / 0.1)}`;
}
export function compare(records: Observation[]) {
  const modis = records.filter((r) => r.sensor === "MODIS"),
    viirs = records.filter((r) => r.sensor === "VIIRS");
  const a = new Set(modis.map(cellKey)),
    b = new Set(viirs.map(cellKey));
  return {
    modis: modis.length,
    viirs: viirs.length,
    modisCells: a.size,
    viirsCells: b.size,
    shared: [...a].filter((k) => b.has(k)).length,
    union: new Set([...a, ...b]).size,
  };
}
export function exportCSV(records: Observation[]) {
  const safe = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);
  return Papa.unparse(
    records.map((r) => ({
      latitude: r.latitude,
      longitude: r.longitude,
      acq_date: r.date,
      acq_time: r.time,
      instrument: r.sensor,
      satellite: safe(r.satellite),
      confidence: safe(r.confidence),
      frp: r.frp,
      scan: safe(r.metadata?.scan ?? ''),
      track: safe(r.metadata?.track ?? ''),
      version: safe(r.metadata?.version ?? ''),
      daynight: safe(r.metadata?.daynight ?? ''),
      source: safe(r.source),
      dataset_kind: r.synthetic ? "synthetic" : "imported-unverified",
    })),
  );
}
export function sampleData(): Observation[] {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const records = Array.from({ length: 640 }, (_, i) => {
    const month = Math.floor(random() * 12),
      day = 1 + Math.floor(random() * 28);
    const base = {
      latitude: Math.round((7.5 + random() * 3.4) * 10000) / 10000,
      longitude: Math.round((-2.8 + random() * 3.3) * 10000) / 10000,
      date: `2025-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      time: i % 2 ? "1320" : "0140",
      sensor: (i % 3 === 0 ? "MODIS" : "VIIRS") as Sensor,
      satellite: i % 3 === 0 ? "Terra" : "Suomi NPP",
      confidence: i % 3 === 0 ? "80" : "n",
      frp: Math.round(random() * 450) / 10,
    };
    return {
      ...base,
      id: key(base),
      source: "Synthetic demonstration - not NASA observations",
      synthetic: true,
    };
  });
  // Paired synthetic observations exercise the controls, not science validation.
  for (let i = 1; i < records.length; i += 6) {
    records[i] = { ...records[i], latitude: records[i - 1].latitude + 0.001, longitude: records[i - 1].longitude + 0.001, date: records[i - 1].date, time: '0150' };
    records[i].id = key(records[i]);
  }
  return records;
}
