// Central export for all brand assets scraped from grabnwear.store
import logoJson from './logo.webp.asset.json';
import hero1Json from './hero-1.jpg.asset.json';
import hero2Json from './hero-2.jpg.asset.json';
import hero3Json from './hero-3.jpg.asset.json';
import codJson from './payment-cod.png.asset.json';
import jazzcashJson from './payment-jazzcash.png.asset.json';
import easypaisaJson from './payment-easypaisa.png.asset.json';
import tlBlueprintJson from './timeline-blueprint.webp.asset.json';
import tlCottonJson from './timeline-cotton.webp.asset.json';
import tlStitchJson from './timeline-stitch.webp.asset.json';
import tlPodJson from './timeline-pod.webp.asset.json';

export const brandAssets = {
  logo: logoJson.url,
  hero1: hero1Json.url,
  hero2: hero2Json.url,
  hero3: hero3Json.url,
  paymentCod: codJson.url,
  paymentJazzcash: jazzcashJson.url,
  paymentEasypaisa: easypaisaJson.url,
  timelineBlueprint: tlBlueprintJson.url,
  timelineCotton: tlCottonJson.url,
  timelineStitch: tlStitchJson.url,
  timelinePod: tlPodJson.url,
};
