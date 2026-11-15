import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173/");
await page.getByRole("button", { name: /Explore example/ }).click();
await page.getByText("Synthetic demonstration", { exact: true }).waitFor();
await page
  .waitForFunction(
    () =>
      [...document.querySelectorAll(".leaflet-tile")].some(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    undefined, { timeout: 10000 },
  )
  .catch(() => {});
await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
await page.getByRole("button", { name: "Compare the sensors" }).click();
await page
  .getByRole("heading", { name: "Source comparison", exact: true })
  .waitFor();
await page
  .getByRole("button", { name: "Method & limitations", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Before claiming validated harmonization" })
  .waitFor();
await page.getByRole("button", { name: "Fire explorer", exact: true }).click();
const csv =
  "latitude,longitude,acq_date,acq_time,instrument,satellite,confidence,frp\n9.4,-0.84,2025-01-01,1325,VIIRS,N,n,12.5\n9.4,-0.84,2025-01-02,1325,MODIS,T,80,14\n";
await page.locator("input[type=file]").setInputFiles({
  name: "verified-fixture.csv",
  mimeType: "text/csv",
  buffer: Buffer.from(csv),
});
await page.getByText("Imported observations", { exact: true }).waitFor();
await page.getByText(/Imported 2 observations in total/).waitFor();
await page.getByLabel("2025-01-01, 1 detections; coverage unknown").click();
const downloadEvent = page.waitForEvent("download");
await page.getByRole("button", { name: "Export CSV" }).click();
await downloadEvent;
await page.getByRole("button", { name: "Clear selected date" }).click();
await page.locator("input[type=file]").setInputFiles({
  name: "invalid.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("bad,columns\n1,2"),
});
await page
  .getByRole("alert")
  .filter({ hasText: "Missing required column" })
  .waitFor();
await page.getByRole("button", { name: "Dismiss error" }).click();
await page.getByRole("button", { name: "Clear data" }).click();
await page.getByRole("button", { name: /Explore example/ }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
if (overflow) throw new Error("Mobile viewport has horizontal overflow");
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "UI checks passed: demo, navigation, CSV import, day filter, export, invalid file recovery, mobile layout, no browser errors.",
);
await browser.close();
