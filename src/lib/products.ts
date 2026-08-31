import p1 from "@/assets/product1.jpg";
import p2 from "@/assets/product2.jpg";
import p3 from "@/assets/product3.jpg";

export type Product = {
  id: string;
  name: string;
  tag: string;
  price: number;
  img: string;
  accent: "blue" | "green";
  category: "Injectables" | "Oral" | "Peptides";
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  stack: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: "bpc-157",
    name: "BPC-157",
    tag: "Injectible",
    price: 89,
    img: p1,
    accent: "blue",
    category: "Injectables",
    summary: "Body Protection Compound — the gold standard for connective tissue repair.",
    description:
      "A 15-amino-acid pentadecapeptide derived from a gastric protein. Rapidly accelerates tendon, ligament, and gut lining repair. Angiogenic, cytoprotective, and remarkably stable.",
    specs: [
      { label: "Purity", value: "99.4% (HPLC)" },
      { label: "Weight", value: "5mg lyophilized" },
      { label: "Half-life", value: "~4 hours" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["tb-500", "ghk-cu"],
  },
  {
    id: "tb-500",
    name: "TB-500",
    tag: "Repair",
    price: 129,
    img: p2,
    accent: "green",
    category: "Injectables",
    summary: "Systemic actin regulator — flexibility, wound healing, and cardiac support.",
    description:
      "A synthetic fragment of Thymosin Beta-4. Upregulates actin, drives cell migration, and modulates inflammation. Ideal for chronic injuries and full-body recomp phases.",
    specs: [
      { label: "Purity", value: "99.2% (HPLC)" },
      { label: "Weight", value: "5mg lyophilized" },
      { label: "Half-life", value: "~2 hours" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["bpc-157", "igf-1-lr3"],
  },
  {
    id: "igf-1-lr3",
    name: "IGF-1 LR3",
    tag: "Growth",
    price: 179,
    img: p3,
    accent: "blue",
    category: "Injectables",
    summary: "Long-arg-3 IGF-1 — hypertrophy driver with prolonged serum activity.",
    description:
      "Extended half-life analog of IGF-1. Drives satellite cell proliferation, protein synthesis, and hyperplasia. Reserved for advanced protocols.",
    specs: [
      { label: "Purity", value: "98.9% (HPLC)" },
      { label: "Weight", value: "1mg lyophilized" },
      { label: "Half-life", value: "~20 hours" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["cjc-1295", "mots-c"],
  },
  {
    id: "ghk-cu",
    name: "GHK-Cu",
    tag: "Regenerate",
    price: 74,
    img: p1,
    accent: "green",
    category: "Oral",
    summary: "Copper peptide — skin, hair, and systemic regenerative signaling.",
    description:
      "A naturally occurring tripeptide complexed with copper. Modulates gene expression toward a youthful state and supports antioxidant defense.",
    specs: [
      { label: "Purity", value: "99.6% (HPLC)" },
      { label: "Weight", value: "50mg lyophilized" },
      { label: "Half-life", value: "~1 hour" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["bpc-157"],
  },
  {
    id: "mots-c",
    name: "MOTS-C",
    tag: "Metabolic",
    price: 149,
    img: p2,
    accent: "blue",
    category: "Oral",
    summary: "Mitochondrial-derived peptide for insulin sensitivity and endurance.",
    description:
      "Encoded within mitochondrial DNA. Improves glucose uptake, fat oxidation, and cellular energy output. A metabolic reset in a vial.",
    specs: [
      { label: "Purity", value: "99.1% (HPLC)" },
      { label: "Weight", value: "10mg lyophilized" },
      { label: "Half-life", value: "~3 hours" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["cjc-1295"],
  },
  {
    id: "cjc-1295",
    name: "CJC-1295",
    tag: "GH Release",
    price: 119,
    img: p3,
    accent: "green",
    category: "Oral",
    summary: "GHRH analog — amplifies natural growth hormone pulses.",
    description:
      "Extended-half-life growth hormone releasing hormone analog. Restores youthful GH pulses without receptor desensitization. Pair with Ipamorelin.",
    specs: [
      { label: "Purity", value: "99.3% (HPLC)" },
      { label: "Weight", value: "2mg lyophilized" },
      { label: "Half-life", value: "~8 days (with DAC)" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["ipamorelin", "igf-1-lr3"],
  },
  {
    id: "ipamorelin",
    name: "Ipamorelin",
    tag: "GH Pulse",
    price: 99,
    img: p1,
    accent: "blue",
    category: "Injectables",
    summary: "Selective GH secretagogue — clean pulse, no cortisol spike.",
    description:
      "A pentapeptide ghrelin mimetic. Triggers clean, selective growth hormone release without prolactin or cortisol elevation. The 'sleep stack' favorite.",
    specs: [
      { label: "Purity", value: "99.5% (HPLC)" },
      { label: "Weight", value: "5mg lyophilized" },
      { label: "Half-life", value: "~2 hours" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["cjc-1295"],
  },
  {
    id: "tesamorelin",
    name: "Tesamorelin",
    tag: "Recomp",
    price: 189,
    img: p2,
    accent: "green",
    category: "Oral",
    summary: "Visceral fat reduction with lean tissue preservation.",
    description:
      "A stabilized GHRH analog clinically validated for visceral adipose reduction. Elite recomposition tool for advanced users.",
    specs: [
      { label: "Purity", value: "99.0% (HPLC)" },
      { label: "Weight", value: "10mg lyophilized" },
      { label: "Half-life", value: "~30 minutes" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["mots-c"],
  },
  {
    id: "aod-9604",
    name: "AOD-9604",
    tag: "Fat Loss",
    price: 84,
    img: p3,
    accent: "blue",
    category: "Oral",
    summary: "Anti-obesity fragment — lipolysis without GH side-effects.",
    description:
      "A modified fragment of the C-terminus of HGH. Stimulates lipolysis and inhibits lipogenesis without affecting insulin sensitivity or growth pathways.",
    specs: [
      { label: "Purity", value: "98.8% (HPLC)" },
      { label: "Weight", value: "2mg lyophilized" },
      { label: "Half-life", value: "~30 minutes" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["mots-c", "tesamorelin"],
  },
  {
    id: "epithalon",
    name: "Epithalon",
    tag: "Longevity",
    price: 109,
    img: p1,
    accent: "green",
    category: "Oral",
    summary: "Telomerase activator — deep sleep, circadian, cellular longevity.",
    description:
      "A tetrapeptide isolated from the pineal gland. Upregulates telomerase, restores melatonin rhythm, and supports cellular senescence markers.",
    specs: [
      { label: "Purity", value: "99.7% (HPLC)" },
      { label: "Weight", value: "10mg lyophilized" },
      { label: "Half-life", value: "~30 minutes" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["ghk-cu"],
  },
  {
    id: "semax",
    name: "Semax",
    tag: "Nootropic",
    price: 94,
    img: p2,
    accent: "blue",
    category: "Injectables",
    summary: "Neuropeptide — focus, BDNF upregulation, neuroprotection.",
    description:
      "A synthetic ACTH fragment. Upregulates BDNF, enhances cognition, and protects against oxidative CNS stress. The mental edge under load.",
    specs: [
      { label: "Purity", value: "99.4% (HPLC)" },
      { label: "Weight", value: "30mg (nasal)" },
      { label: "Half-life", value: "~30 minutes" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["selank"],
  },
  {
    id: "selank",
    name: "Selank",
    tag: "Anxiolytic",
    price: 89,
    img: p3,
    accent: "green",
    category: "Oral",
    summary: "Anxiolytic peptide — calm focus without sedation.",
    description:
      "A synthetic tuftsin analog. Modulates GABAergic tone, immune function, and enkephalin degradation. Focus under pressure, without benzo blur.",
    specs: [
      { label: "Purity", value: "99.2% (HPLC)" },
      { label: "Weight", value: "15mg (nasal)" },
      { label: "Half-life", value: "~30 minutes" },
      { label: "Storage", value: "2–8°C" },
    ],
    stack: ["semax"],
  },
];

export const CATEGORIES = ["All", "Injectables", "Oral", "Peptides"] as const;
export type Category = (typeof CATEGORIES)[number];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
