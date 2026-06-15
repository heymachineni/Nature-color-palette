import sharp from "sharp";
import { extractPalette } from "../src/lib/color/extract.ts";
async function load(slug){ return sharp(`public/birds/${slug}-cutout.webp`).ensureAlpha()
  .resize({width:720,height:720,fit:"inside",withoutEnlargement:true}).raw().toBuffer({resolveWithObject:true}); }
const opts = [
  {label:"boost1 merge8", o:{centerWeight:false,backgroundSubtraction:false,saturationBoost:1,alphaThreshold:210,mergeThreshold:8}},
  {label:"boost1 merge14", o:{centerWeight:false,backgroundSubtraction:false,saturationBoost:1,alphaThreshold:210,mergeThreshold:14}},
  {label:"boost1 merge18", o:{centerWeight:false,backgroundSubtraction:false,saturationBoost:1,alphaThreshold:210,mergeThreshold:18}},
];
for(const slug of ["painted-bunting","resplendent-quetzal","blue-jay","keel-billed-toucan","scarlet-macaw"]){
  const {data,info}=await load(slug);
  console.log("\n### "+slug);
  for(const {label,o} of opts){
    const p=extractPalette(data,info.width,info.height,o);
    console.log(" "+label.padEnd(16), p.slice(0,5).map(c=>c.hex+'('+c.colorName+' '+c.dominancePct+')').join(' '));
  }
}
