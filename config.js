/* ===== CONFIG : à modifier facilement ===== */
const CONFIG = {
  whatsapp: "242068718699",
  facebook: "https://facebook.com/patricia",
  tiktok: "https://www.tiktok.com/@patriciamokoutou",
  adresse: "Quartier Domaine, Brazzaville (arrêt Pelepele)",
  horaires: "Lun – Sam : 8h – 19h · Dimanche : fermé",
  /* Gestion des photos par Patricia (voir supabase-setup.sql) : laissez vide pour désactiver */
  supabaseUrl: "https://pbvlfhfouyphjbmgruxn.supabase.co",
  supabaseKey: "sb_publishable_zZe5h8qmSELo8cUth4jytg_kFRGlDmo",
};
/* Photos : 1.jpeg, 2.jpeg ... chaque catégorie commence au numéro "start" */
const CATS = [
  {
    id: "box-braids",
    name: "Box Braids",
    icon: "fa-gem",
    start: 1,
    desc: "Les classiques indémodables, du knotless léger aux longueurs XXL.",
    t: ["Box Braids Classiques", "Knotless Braids", "Box Braids Gold", "Box Braids Longues"],
  },
  {
    id: "nattes",
    name: "Nattes & Cornrows",
    icon: "fa-wand-magic-sparkles",
    start: 5,
    desc: "Nattes collées, motifs graphiques et stitch braids dessinés à la main.",
    t: ["Nattes Collées", "Nattes Africaines", "Cornrows Design", "Stitch Braids"],
  },
  {
    id: "fulani",
    name: "Fulani Braids",
    icon: "fa-crown",
    start: 9,
    desc: "Perles, anneaux et tresses centrales : l'élégance peule revisitée.",
    t: ["Fulani Royales", "Fulani Perles", "Fulani Bohème", "Fulani Cœur"],
  },
  {
    id: "twists",
    name: "Twists",
    icon: "fa-spa",
    start: 13,
    desc: "Passion twists, sénégalaises et mini twists, légers et très stylés.",
    t: ["Passion Twists", "Senegalese Twists", "Mini Twists", "Twists Bohème"],
  },
  {
    id: "chignons",
    name: "Chignons",
    icon: "fa-heart",
    start: 17,
    desc: "Mariages, soirées, cérémonies : un chignon qui tient et qui brille.",
    t: ["Chignon Mariage", "Chignon Bas Chic", "Bun Stylisé", "Chignon Tressé"],
  },
  {
    id: "coupes",
    name: "Coupes",
    icon: "fa-scissors",
    start: 21,
    desc: "Carrés, pixies et dégradés modernes taillés sur mesure.",
    t: ["Carré Plongeant", "Coupe Pixie", "Dégradé Moderne", "Coupe Signature"],
  },
];
CATS.forEach((c) => (c.photos = c.t.map((t, i) => ({ n: c.start + i, t, cat: c.name }))));
