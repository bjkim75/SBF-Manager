// Regenerate public/sbf-master.json from the seed `items` in app/data.ts.
// Run with: npm run gen:sbf-master
// This produces the initial file-based persistent SBF master snapshot (PER-03)
// so the app loads real data in dev/build and the render tests stay green.
import {writeFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {items,iaHeaders} from "../app/data.ts";
import {serializeSnapshot} from "../app/sbf-master-file.ts";

const here=dirname(fileURLToPath(import.meta.url));
const outPath=resolve(here,"../public/sbf-master.json");

const json=serializeSnapshot({
  meta:{
    versionNo:"v2.5",
    publishedAt:new Date().toISOString(),
    publisher:"seed",
    reason:"seed 데이터에서 생성한 초기 SBF 마스터 스냅샷",
    itemCount:items.length,
    sourceFile:"SKT_Business_Framework_v2.5.xlsx",
    sourceSheet:"1. IA",
  },
  iaHeaders,
  items,
});

mkdirSync(dirname(outPath),{recursive:true});
writeFileSync(outPath,json,"utf-8");
console.log(`wrote ${outPath} (${items.length} items)`);
