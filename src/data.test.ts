import { describe, it, expect } from "vitest";
import {
  parseCSV,
  mergeRecords,
  compare,
  exportCSV,
  validDate,
  inRegion,
  sampleData,
} from "./data";
const header =
  "latitude,longitude,acq_date,acq_time,instrument,satellite,confidence,frp\n";
const row = "9.4,-0.84,2025-01-01,1325,VIIRS,N,nominal,12.5";
describe("FIRMS ingestion", () => {
  it('retains pixel dimensions and product version through CSV roundtrip', () => {
    const data = parseCSV('latitude,longitude,acq_date,acq_time,instrument,scan,track,version,daynight\n9,-1,2025-01-01,1230,VIIRS,0.51,0.66,2.0NRT,D', 'NASA fixture').records;
    expect(parseCSV(exportCSV(data), 'roundtrip').records[0].metadata).toEqual({ scan: '0.51', track: '0.66', version: '2.0NRT', daynight: 'D' });
  });
  it("preserves provenance and synthetic identity through export and reimport", () => {
    const demo = sampleData().slice(0, 2);
    const imported = parseCSV(exportCSV(demo), "renamed-export.csv").records;
    expect(imported[0].source).toBe(demo[0].source);
    expect(imported.every((r) => r.synthetic)).toBe(true);
  });
  it("preserves UTC time, source and sensor confidence", () => {
    const { records } = parseCSV(header + row, "test.csv");
    expect(records[0]).toMatchObject({
      time: "1325",
      source: "test.csv",
      confidence: "nominal",
      sensor: "VIIRS",
    });
  });
  it("rejects invalid coordinates, dates, time and FRP", () => {
    const result = parseCSV(
      header +
        [
          row,
          "91,0,2025-01-01,1325,VIIRS,N,n,1",
          "0,0,2025-02-30,1325,VIIRS,N,n,1",
          "0,0,2025-01-01,2460,VIIRS,N,n,1",
          "0,0,2025-01-01,1325,VIIRS,N,n,-1",
          "0,0,2025-01-01,,VIIRS,N,n,1",
        ].join("\n"),
      "test",
    );
    expect(result.records).toHaveLength(1);
    expect(result.rejected).toBe(5);
  });
  it("deduplicates within and across imports", () => {
    const parsed = parseCSV(header + row + "\n" + row, "a");
    expect(parsed.duplicates).toBe(1);
    expect(mergeRecords(parsed.records, parsed.records).duplicates).toBe(1);
  });
  it("handles quoted filenames in safe export and neutralizes formulas", () => {
    const parsed = parseCSV(header + row, '=HYPERLINK("bad")');
    const csv = exportCSV(parsed.records);
    expect(csv).toContain("'=HYPERLINK");
  });
  it("requires known sensor or identifiable brightness columns", () => {
    expect(() =>
      parseCSV(
        "latitude,longitude,acq_date,acq_time\n9,0,2025-01-01,1300",
        "test",
      ),
    ).toThrow("No valid");
  });
  it("distinguishes detection counts from shared geographic cells", () => {
    const a = parseCSV(
      header + row + "\n9.4,-0.84,2025-01-02,1325,MODIS,T,80,15",
      "test",
    ).records;
    expect(compare(a)).toMatchObject({
      modis: 1,
      viirs: 1,
      shared: 1,
      union: 1,
    });
    expect(inRegion(a[0], "tamale")).toBe(true);
  });
  it("validates leap dates", () => {
    expect(validDate("2024-02-29")).toBe(true);
    expect(validDate("2025-02-29")).toBe(false);
  });
});
