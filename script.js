/* Photos gérées depuis admin.html : si une catégorie en contient, elles remplacent les photos locales */
async function loadRemotePhotos() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;
  try {
    const r = await fetch(
      `${CONFIG.supabaseUrl}/rest/v1/photos?select=category,title,url&order=created_at.asc`,
      {
        headers: {
          apikey: CONFIG.supabaseKey,
          /* les clés sb_publishable_... ne sont pas des JWT : pas d'en-tête Authorization */
          ...(CONFIG.supabaseKey.startsWith("sb_") ? {} : { Authorization: `Bearer ${CONFIG.supabaseKey}` }),
        },
      },
    );
    if (!r.ok) return;
    const rows = await r.json();
    CATS.forEach((c) => {
      const mine = rows.filter((x) => x.category === c.id);
      if (mine.length)
        c.photos = mine.map((x) => ({ n: x.url, t: x.title.replace(/[<>"]/g, ""), cat: c.name }));
    });
  } catch (e) {
    console.warn("Photos en ligne indisponibles, photos locales utilisées.", e);
  }
}

(async () => {
  await loadRemotePhotos();
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wa = (txt = "") =>
    `https://wa.me/${CONFIG.whatsapp}${txt ? `?text=${encodeURIComponent(txt)}` : ""}`;
  const media = (n, alt = "") => {
    const remote = String(n).startsWith("http");
    return `<div class="media"><img src="${remote ? n : n + ".jpeg"}" alt="${alt}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph&quot;>${remote ? "" : n}</div>'"></div>`;
  };

  /* ===== Structure commune ===== */
  const PAGES = [
    ["index", "Accueil"],
    ["about", "À propos"],
    ["coiffures", "Coiffures"],
    ["contact", "Contact"],
  ];
  const cur = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
<div class="prog"></div><div class="glow"></div>
<header class="hdr"><a href="index.html" class="logo">MOKOUTOU PATRICIA</a>
<button class="burger" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
<ul class="nav">${PAGES.map(([p, l]) => `<li><a href="${p}.html" class="${p === cur ? "on" : ""}">${l}</a></li>`).join("")}</ul></header>`,
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `
<footer class="ftr"><p>&copy; 2026 MOKOUTOU PATRICIA COIFFURE. Tous droits réservés.</p></footer>
<nav class="dock" aria-label="Accès rapide">
<a href="${wa("Bonjour Patricia, je souhaite prendre rendez-vous.")}" target="_blank" rel="noopener" style="--c:#25d366"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></a>
<a href="${CONFIG.facebook}" target="_blank" rel="noopener" style="--c:#1877f2"><i class="fa-brands fa-facebook-f"></i><span>Facebook</span></a>
<a href="${CONFIG.tiktok}" target="_blank" rel="noopener" style="--c:#fe2c55"><i class="fa-brands fa-tiktok"></i><span>TikTok</span></a></nav>
<div class="bot"><button class="bt" aria-label="Ouvrir l'assistant"><i class="fa-solid fa-comment-dots"></i><span class="dot"></span></button>
<div class="bw"><div class="bh"><div class="who"><div class="av">P</div><div><h4>Assistant Patricia</h4><small>En ligne</small></div></div><button aria-label="Fermer">&times;</button></div>
<div class="chat"></div><div class="bi"><input placeholder="Posez votre question..." aria-label="Message"><button aria-label="Envoyer"><i class="fa-solid fa-paper-plane"></i></button></div></div></div>
<div class="lb"><button class="x" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button><button class="pv" aria-label="Précédent"><i class="fa-solid fa-chevron-left"></i></button><button class="nx" aria-label="Suivant"><i class="fa-solid fa-chevron-right"></i></button><div class="fr"></div><p></p><small></small></div>`,
  );

  $(".burger").onclick = () => $(".nav").classList.toggle("open");
  $$("[data-cfg]").forEach((e) => (e.innerHTML = CONFIG[e.dataset.cfg]));
  $$("[data-wa]").forEach((e) => (e.href = wa(e.dataset.wa)));
  $$("[data-img]").forEach((e) => e.insertAdjacentHTML("afterbegin", media(e.dataset.img)));
  addEventListener(
    "scroll",
    () => {
      $(".prog").style.width = (scrollY / (document.body.scrollHeight - innerHeight)) * 100 + "%";
    },
    { passive: true },
  );
  addEventListener("pointermove", (e) => {
    const g = $(".glow");
    g.style.left = e.clientX + "px";
    g.style.top = e.clientY + "px";
  });

  /* ===== Lightbox ===== */
  let LB = { list: [], i: 0 };
  function openLB(list, i) {
    LB = { list, i };
    $(".lb").classList.add("on");
    document.body.style.overflow = "hidden";
    showLB();
  }
  function showLB() {
    const p = LB.list[LB.i];
    $(".lb .fr").innerHTML = media(p.n, p.t);
    $(".lb p").textContent = p.t;
    $(".lb small").textContent = `${p.cat} · ${LB.i + 1} / ${LB.list.length}`;
  }
  const stepLB = (d) => {
    LB.i = (LB.i + d + LB.list.length) % LB.list.length;
    showLB();
  };
  const closeLB = () => {
    $(".lb").classList.remove("on");
    document.body.style.overflow = "";
  };
  $(".lb .x").onclick = closeLB;
  $(".lb .pv").onclick = () => stepLB(-1);
  $(".lb .nx").onclick = () => stepLB(1);
  $(".lb").onclick = (e) => {
    if (e.target.classList.contains("lb")) closeLB();
  };
  let sx = 0;
  $(".lb").addEventListener("touchstart", (e) => (sx = e.touches[0].clientX));
  $(".lb").addEventListener("touchend", (e) => {
    const d = e.changedTouches[0].clientX - sx;
    if (Math.abs(d) > 50) stepLB(d > 0 ? -1 : 1);
  });

  /* ===== Cartes 3D (inclinaison + reflet) ===== */
  function tilt(el, max = 9) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width,
        y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", (0.5 - y) * max + "deg");
      el.style.setProperty("--ry", (x - 0.5) * max + "deg");
      el.style.setProperty("--mx", x * 100 + "%");
      el.style.setProperty("--my", y * 100 + "%");
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }

  /* ===== ACCUEIL ===== */
  const hc = $("#home-cats");
  if (hc) {
    hc.innerHTML = CATS.map(
      (c) =>
        `<a href="coiffures.html#${c.id}" class="cat rv">${media(c.photos[0].n, c.name)}<div class="cap"><h3>${c.name}</h3><span>${c.photos.length} photos <i class="fa-solid fa-arrow-right"></i></span></div></a>`,
    ).join("");
    const all = CATS.flatMap((c) => c.photos);
    $("#marquee").innerHTML = [...all, ...all]
      .map((p, i) => `<div class="mi" data-i="${i % all.length}">${media(p.n, p.t)}</div>`)
      .join("");
    $$("#marquee .mi").forEach((m) => (m.onclick = () => openLB(all, +m.dataset.i)));
    $$("#home-cats .cat").forEach((c) => tilt(c, 6));
    $("#n-styles").dataset.count = CATS.length;
    $("#n-photos").dataset.count = all.length;
  }

  /* ===== COIFFURES ===== */
  const cs = $("#cat-sections");
  if (cs) {
    cs.innerHTML = CATS.map(
      (
        c,
      ) => `<section class="csec" id="${c.id}" data-id="${c.id}"><div class="wrap"><h2>${c.name}</h2><p class="d">${c.desc}</p>
  <div class="grid">${c.photos.map((p, i) => `<div class="pc rv" data-c="${c.id}" data-i="${i}"><span class="nb">${c.name}</span>${media(p.n, p.t)}<div class="ov"><b>${p.t}</b><i class="fa-solid fa-expand"></i></div></div>`).join("")}</div></div></section>`,
    ).join("");
    $("#chips").innerHTML =
      `<button class="chip on" data-f="all"><i class="fa-solid fa-border-all"></i>Toutes</button>` +
      CATS.map(
        (c) =>
          `<button class="chip" data-f="${c.id}"><i class="fa-solid ${c.icon}"></i>${c.name}</button>`,
      ).join("");
    const filt = (f) => {
      $$(".chip").forEach((b) => b.classList.toggle("on", b.dataset.f === f));
      $$(".csec").forEach((s) => {
        const show = f === "all" || s.dataset.id === f;
        s.style.display = show ? "" : "none";
        if (show)
          $$(".pc", s).forEach((p) => {
            p.classList.remove("in");
            void p.offsetWidth;
            setTimeout(() => p.classList.add("in"), 60);
          });
      });
      if (f !== "all") scrollTo({ top: 0, behavior: "smooth" });
    };
    $$(".chip").forEach(
      (b) =>
        (b.onclick = () => {
          history.replaceState(
            null,
            "",
            b.dataset.f === "all" ? "coiffures.html" : "#" + b.dataset.f,
          );
          filt(b.dataset.f);
        }),
    );
    $$(".pc").forEach((p) => {
      tilt(p);
      const c = CATS.find((x) => x.id === p.dataset.c);
      p.onclick = () => openLB(c.photos, +p.dataset.i);
    });
    const h = location.hash.slice(1);
    if (CATS.some((c) => c.id === h)) filt(h);
  }

  /* ===== CONTACT : formulaire -> WhatsApp ===== */
  const sel = $("#f-style");
  if (sel) {
    sel.innerHTML =
      `<option value="">Coiffure souhaitée</option>` +
      CATS.map((c) => `<option>${c.name}</option>`).join("") +
      `<option>Autre / conseil</option>`;
    $("#rdv").onsubmit = (e) => {
      e.preventDefault();
      const n = $("#f-name").value,
        s = sel.value || "à définir",
        d = $("#f-date").value || "à convenir";
      open(
        wa(
          `Bonjour Patricia, je suis ${n}. Je souhaite un rendez-vous pour : ${s}. Date souhaitée : ${d}.`,
        ),
        "_blank",
      );
    };
  }

  /* ===== Compteurs + apparition au scroll ===== */
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target;
        t.classList.add("in");
        io.unobserve(t);
        if (t.dataset.count) {
          const end = +t.dataset.count,
            suf = t.dataset.suf || "";
          let s = null;
          const f = (ts) => {
            s ??= ts;
            const k = Math.min((ts - s) / 1400, 1);
            t.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf;
            if (k < 1) requestAnimationFrame(f);
          };
          requestAnimationFrame(f);
        }
      }),
    { threshold: 0.15 },
  );
  $$(".rv,[data-count]").forEach((e) => io.observe(e));

  /* ===== BOT : base de connaissances ===== */
  const wl = `<a href="${wa("Bonjour Patricia, j'ai une question.")}" target="_blank">WhatsApp</a>`;
  const KB = [
    {
      k: ["bonjour", "salut", "coucou", "hello", "bjr", "bonsoir"],
      a: [
        "Bonjour et bienvenue ! Je suis l'assistant de Patricia. Que puis-je faire pour vous ?",
        "Enchantée ! Prête pour un nouveau look ?",
      ],
      c: ["Nos coiffures", "Tarifs", "Rendez-vous"],
    },
    {
      k: ["merci", "super", "parfait", "genial"],
      a: ["Avec plaisir ! N'hésitez pas si vous avez d'autres questions 💛"],
      c: ["Rendez-vous", "Entretien"],
    },
    {
      k: ["coiffure", "coiffures", "catalogue", "style", "modele", "realisation", "photo"],
      a: [
        "Patricia réalise box braids, nattes, Fulani, twists, chignons et coupes. <a href='coiffures.html'>Voir la galerie</a> pour vous inspirer !",
      ],
      c: ["Box braids", "Fulani", "Twists", "Chignon"],
    },
    {
      k: ["prix", "tarif", "combien", "coute", "cout", "fcfa", "devis"],
      a: [
        "Le tarif dépend du style, de la longueur et de la taille des tresses. Envoyez une photo de votre modèle préféré sur " +
          wl +
          " pour un devis rapide.",
      ],
      c: ["Rendez-vous", "Durée"],
    },
    {
      k: ["rdv", "rendez", "reserver", "reservation", "prendre"],
      a: [
        "Super idée ! Remplissez le <a href='contact.html'>formulaire de rendez-vous</a> ou écrivez directement sur " +
          wl +
          ".",
      ],
      c: ["Préparation", "Localisation"],
    },
    {
      k: ["ou", "adresse", "localisation", "situe", "trouve", "salon", "venir"],
      a: [
        "Le salon est à Brazzaville : " +
          CONFIG.adresse +
          ". Pour l'itinéraire, demandez sur " +
          wl +
          ".",
      ],
      c: ["Horaires", "Rendez-vous"],
    },
    {
      k: ["horaire", "heure", "ouvert", "ouvre", "ferme", "dimanche"],
      a: ["Horaires : " + CONFIG.horaires + ". Confirmez toujours votre créneau avec Patricia."],
      c: ["Rendez-vous"],
    },
    {
      k: ["duree", "temps", "longtemps", "heures", "prend"],
      a: [
        "Comptez environ 3 à 8 heures pour des tresses (selon la taille et la longueur), 1 à 2 h pour un chignon ou une coupe. Patricia vous donne une estimation précise au moment du devis.",
      ],
      c: ["Tarifs", "Préparation"],
    },
    {
      k: ["tient", "tenue", "garder", "semaines", "combien de temps"],
      a: [
        "Des tresses se gardent en général 4 à 8 semaines avec un bon entretien. Au-delà, la repousse fragilise les racines.",
      ],
      c: ["Entretien", "Lavage"],
    },
    {
      k: ["entretien", "entretenir", "soin", "hydrat", "huile", "nuit", "dormir", "bonnet"],
      a: [
        "Pour garder vos tresses nickel : hydratez le cuir chevelu avec une huile légère, protégez-les la nuit avec un bonnet ou une taie en satin, et évitez de les serrer en queue de cheval tous les jours.",
      ],
      c: ["Lavage", "Cheveux abîmés"],
    },
    {
      k: ["lav", "shampoing", "laver", "propre"],
      a: [
        "Lavez le cuir chevelu toutes les 2 semaines environ avec un shampoing dilué, massez doucement, rincez bien et séchez complètement pour éviter l'humidité et les odeurs.",
      ],
      c: ["Entretien", "Durée de tenue"],
    },
    {
      k: ["mal", "douleur", "tire", "tension", "serre", "sensible"],
      a: [
        "Dites-le à Patricia pendant la séance : les tresses ne doivent jamais faire mal. Une tension excessive abîme les racines. Les premiers jours, un léger inconfort est normal, une vraie douleur ne l'est pas.",
      ],
      c: ["Cheveux abîmés", "Entretien"],
    },
    {
      k: ["abime", "casse", "chute", "fragile", "secs", "sec", "pousse", "croissance"],
      a: [
        "Pour des cheveux fragiles : faites une pause entre deux poses, hydratez (huile de ricin, karité), évitez les tresses trop serrées et coupez les pointes régulièrement. Patricia peut aussi vous conseiller en salon.",
      ],
      c: ["Entretien", "Rendez-vous"],
    },
    {
      k: ["box", "braids", "knotless"],
      a: [
        "Les box braids sont un grand classique ! Patricia propose le knotless (plus léger, moins de tension) et différentes longueurs. <a href='coiffures.html#box-braids'>Voir les photos</a>.",
      ],
      c: ["Tarifs", "Durée"],
    },
    {
      k: ["fulani", "perle", "peule"],
      a: [
        "Les Fulani braids : tresses centrales, perles et anneaux. Très tendance ! <a href='coiffures.html#fulani'>Voir les photos</a>.",
      ],
      c: ["Tarifs", "Rendez-vous"],
    },
    {
      k: ["nattes", "natte", "cornrows", "collees", "stitch"],
      a: [
        "Nattes collées, cornrows et stitch braids : des motifs sur mesure. <a href='coiffures.html#nattes'>Voir les photos</a>.",
      ],
      c: ["Tarifs", "Durée"],
    },
    {
      k: ["twist", "twists", "senegalaise", "passion"],
      a: [
        "Passion twists et sénégalaises : légères, souples et très stylées. <a href='coiffures.html#twists'>Voir les photos</a>.",
      ],
      c: ["Tarifs", "Entretien"],
    },
    {
      k: ["chignon", "mariage", "mariee", "soiree", "ceremonie", "bun", "evenement"],
      a: [
        "Patricia coiffe les mariées et les invitées : chignon bas chic, bun, chignon tressé. Réservez tôt pour les mariages, et prévoyez un essai ! <a href='coiffures.html#chignons'>Voir les photos</a>.",
      ],
      c: ["Rendez-vous", "Tarifs"],
    },
    {
      k: ["coupe", "carre", "pixie", "degrade", "couper"],
      a: [
        "Carrés, pixies, dégradés : coupes sur mesure selon la forme de votre visage. <a href='coiffures.html#coupes'>Voir les photos</a>.",
      ],
      c: ["Rendez-vous", "Tarifs"],
    },
    {
      k: ["tissage", "meche", "meches", "perruque", "rajout", "extension", "lace"],
      a: [
        "Pour les mèches et rajouts (type, quantité, couleur), confirmez avec Patricia sur " +
          wl +
          " : elle vous dira si vous devez les apporter ou si elle s'en occupe.",
      ],
      c: ["Tarifs", "Rendez-vous"],
    },
    {
      k: ["enfant", "fille", "petite", "bebe", "kid"],
      a: [
        "Les petites princesses sont les bienvenues ! Prévoyez des tresses légères et une séance adaptée. Précisez l'âge de l'enfant à Patricia.",
      ],
      c: ["Durée", "Rendez-vous"],
    },
    {
      k: ["preparer", "preparation", "avant", "apporter", "dois"],
      a: [
        "Venez avec des cheveux propres, bien démêlés et séchés. Si vous avez une photo du style voulu, apportez-la, elle aide beaucoup !",
      ],
      c: ["Rendez-vous", "Durée"],
    },
    {
      k: ["paiement", "payer", "mobile", "money", "cash", "acompte"],
      a: [
        "Pour les modes de paiement et un éventuel acompte, merci de confirmer avec Patricia sur " +
          wl +
          ".",
      ],
      c: ["Rendez-vous"],
    },
    {
      k: ["annuler", "annulation", "retard", "reporter", "decaler"],
      a: [
        "Un empêchement ? Prévenez Patricia le plus tôt possible sur " +
          wl +
          " pour décaler votre rendez-vous.",
      ],
      c: ["Rendez-vous"],
    },
    {
      k: ["facebook", "tiktok", "reseau", "instagram", "contact", "telephone", "numero", "appeler"],
      a: [
        "Retrouvez Patricia sur <a href='contact.html'>WhatsApp, Facebook et TikTok</a> (boutons en bas à gauche de l'écran) !",
      ],
      c: ["Rendez-vous", "Nos coiffures"],
    },
  ];
  const CHIP = {
    "Nos coiffures": "coiffures",
    Tarifs: "tarifs",
    "Rendez-vous": "rdv",
    Entretien: "entretien",
    Durée: "durée",
    Localisation: "où êtes-vous",
    Horaires: "horaires",
    "Box braids": "box braids",
    Fulani: "fulani",
    Twists: "twists",
    Chignon: "chignon",
    Préparation: "préparation",
    Lavage: "lavage",
    "Cheveux abîmés": "cheveux abîmés",
    "Durée de tenue": "combien de temps ça tient",
  };
  const norm = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const chat = $(".chat"),
    inp = $(".bi input");
  const scroll = () => chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  function say(html, cls, isText) {
    const d = document.createElement("div");
    d.className = "m " + cls;
    isText ? (d.textContent = html) : (d.innerHTML = html);
    chat.appendChild(d);
    scroll();
    return d;
  }
  function chips(list) {
    $$(".sg", chat).forEach((e) => e.remove());
    const w = document.createElement("div");
    w.className = "sg";
    list.forEach((l) => {
      const b = document.createElement("button");
      b.textContent = l;
      b.onclick = () => send(CHIP[l] || l, l);
      w.appendChild(b);
    });
    chat.appendChild(w);
    scroll();
  }
  function answer(q) {
    const t = norm(q),
      words = t.split(/[^a-z0-9]+/);
    let best = null,
      top = 0;
    KB.forEach((i) => {
      let s = 0;
      i.k.forEach((k) => {
        if (
          k.includes(" ")
            ? t.includes(k)
            : words.some((w) => w === k || (k.length > 3 && w.startsWith(k)))
        )
          s += k.length > 3 ? 2 : 1;
      });
      if (s > top) {
        top = s;
        best = i;
      }
    });
    return best
      ? { a: best.a[Math.floor(Math.random() * best.a.length)], c: best.c }
      : {
          a:
            "Je ne suis pas sûre de comprendre, mais Patricia vous répond directement sur " +
            wl +
            " 💬",
          c: ["Nos coiffures", "Tarifs", "Rendez-vous", "Entretien"],
        };
  }
  function send(q, label) {
    q = q.trim();
    if (!q) return;
    say(label || q, "u", true);
    inp.value = "";
    $$(".sg", chat).forEach((e) => e.remove());
    const ty = say("<i></i><i></i><i></i>", "b typing");
    const r = answer(q);
    setTimeout(
      () => {
        ty.remove();
        say(r.a, "b");
        setTimeout(() => chips(r.c), 350);
      },
      700 + Math.random() * 500,
    );
  }
  let greeted = false;
  $(".bt").onclick = () => {
    const w = $(".bw");
    w.classList.toggle("on");
    $(".bt .dot").style.display = "none";
    if (w.classList.contains("on") && !greeted) {
      greeted = true;
      say(
        "Bonjour ! Je suis l'assistant virtuel de Patricia. Comment puis-je vous sublimer aujourd'hui ?",
        "b",
      );
      setTimeout(
        () =>
          chips(["Nos coiffures", "Tarifs", "Rendez-vous", "Entretien", "Durée", "Localisation"]),
        600,
      );
    }
  };
  $(".bh button").onclick = () => $(".bw").classList.remove("on");
  $(".bi button").onclick = () => send(inp.value);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send(inp.value);
  });
  addEventListener("keydown", (e) => {
    if ($(".lb").classList.contains("on")) {
      if (e.key === "ArrowLeft") stepLB(-1);
      if (e.key === "ArrowRight") stepLB(1);
    }
    if (e.key === "Escape") {
      closeLB();
      $(".bw").classList.remove("on");
    }
  });
})();