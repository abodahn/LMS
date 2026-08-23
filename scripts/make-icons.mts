/**
 * Renders the installable-app icons from the brand mark.
 *
 *   npx tsx scripts/make-icons.mts
 *
 * Android reads SVG icons from the manifest, but iOS does not — an installed
 * app needs real PNGs or it gets a screenshot of the page as its home-screen
 * icon. There is no image library in this project and adding one to convert a
 * single logo would be the wrong trade, so the browser already used for the end
 * to end tests does the rasterising.
 *
 * Two shapes, because they are cropped differently:
 *  - `any`      the mark on the brand's own surface, edge to edge;
 *  - `maskable` the same mark inside the safe zone, since Android will clip a
 *               maskable icon to a circle, squircle or rounded square and would
 *               otherwise cut the mark's corners off.
 */
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = "public/brand";
const SIZES = [192, 512];

/** Padding as a fraction of the icon, so the mark survives a circular crop. */
const MASKABLE_INSET = 0.18;

async function main() {
  const mark = await readFile("public/brand/logo-mark.svg", "utf8");
  const encoded = Buffer.from(mark, "utf8").toString("base64");

  const browser = await chromium.launch();
  await mkdir(OUT, { recursive: true });

  for (const size of SIZES) {
    for (const purpose of ["any", "maskable"] as const) {
      const inset = purpose === "maskable" ? size * MASKABLE_INSET : size * 0.08;
      const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
      });

      await page.setContent(
        `<!doctype html><html><body style="margin:0">
           <div style="width:${size}px;height:${size}px;background:#ffffff;
                       display:flex;align-items:center;justify-content:center;
                       box-sizing:border-box;padding:${inset}px">
             <img src="data:image/svg+xml;base64,${encoded}"
                  style="max-width:100%;max-height:100%;object-fit:contain" />
           </div>
         </body></html>`,
        { waitUntil: "networkidle" },
      );

      const buffer = await page.screenshot({ omitBackground: false });
      const name = `icon-${size}${purpose === "maskable" ? "-maskable" : ""}.png`;
      await writeFile(path.join(OUT, name), buffer);
      console.log(`  ${name}  ${(buffer.byteLength / 1024).toFixed(1)} kB`);
      await page.close();
    }
  }

  // Apple ignores the manifest and uses this one; 180 is the size it wants.
  const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await page.setContent(
    `<!doctype html><html><body style="margin:0">
       <div style="width:180px;height:180px;background:#ffffff;display:flex;
                   align-items:center;justify-content:center;box-sizing:border-box;padding:22px">
         <img src="data:image/svg+xml;base64,${encoded}" style="max-width:100%;max-height:100%;object-fit:contain" />
       </div>
     </body></html>`,
    { waitUntil: "networkidle" },
  );
  const apple = await page.screenshot();
  await writeFile(path.join(OUT, "apple-touch-icon.png"), apple);
  console.log(`  apple-touch-icon.png  ${(apple.byteLength / 1024).toFixed(1)} kB`);

  await browser.close();
}

await main();
