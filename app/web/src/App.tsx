import {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { QRCodeSVG } from "qrcode.react";

const PUBLIC_SITE_URL = "https://titanic-sobrevivencia-e-classe.vercel.app/";

type Section = {
  slug: string;
  speaker: string;
  role: string;
  photo: string;
  tone: string;
  position: number;
};
type Formula = { title: string; expression: string; explanation: string; steps: { title: string; text: string }[] };
const decimal = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 8 });
function rateSteps(survivors: number, total: number) {
  return [
    { title: "Fórmula e símbolos", text: "p = S / N; T = p × 100%. S é o número de sobreviventes; N é o total do grupo; p é a proporção e T é a taxa percentual." },
    { title: "Contagem dos registros", text: `S = ${survivors}; não sobreviventes = ${total - survivors}; N = ${survivors} + ${total - survivors} = ${total}. Cada registro com Survived = 1 contribui com uma unidade para S.` },
    { title: "Substituição e divisão", text: `p = ${survivors} / ${total} ≈ ${decimal(survivors / total)}.` },
    { title: "Conversão para porcentagem", text: `T = (${survivors} / ${total}) × 100% ≈ ${decimal(survivors / total * 100)}%.` },
    { title: "Resultado apresentado", text: `T ≈ ${(survivors / total * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%. O cálculo usa a fração original; o arredondamento para uma casa decimal ocorre somente na apresentação.` },
  ];
}
function variationSteps(rows: ClassRow[]) {
  const n = rows.reduce((sum, row) => sum + row.total, 0);
  const sum = rows.reduce((sum, row) => sum + row.pclass * row.total, 0);
  const squares = rows.reduce((sum, row) => sum + row.pclass ** 2 * row.total, 0);
  const mean = sum / n;
  const variance = squares / n - mean ** 2;
  return [
    { title: "Fórmulas e símbolos", text: "μ = Σ(fⱼxⱼ) / N; σ² = Σ[fⱼ(xⱼ − μ)²] / N; σ = √σ²; CV = (σ / μ) × 100%. xⱼ é o código da classe, fⱼ sua frequência, N o total, μ a média e σ o desvio padrão populacional." },
    { title: "Frequências utilizadas", text: rows.map(row => `x = ${row.pclass}: f = ${row.total}`).join("; ") + `. N = ${rows.map(row => row.total).join(" + ")} = ${n}.` },
    { title: "Construção da média", text: `Σ(fⱼxⱼ) = ${rows.map(row => `${row.total} × ${row.pclass}`).join(" + ")} = ${sum}. μ = ${sum} / ${n} ≈ ${decimal(mean)}.` },
    { title: "Desvios quadráticos ponderados", text: `σ² = [${rows.map(row => `${row.total} × (${row.pclass} − ${sum}/${n})²`).join(" + ")}] / ${n}. As frequências incluem todos os registros, sem listar repetidamente cada código.` },
    { title: "Desenvolvimento da variância", text: `Pela identidade σ² = Σ(fⱼxⱼ²)/N − μ²: Σ(fⱼxⱼ²) = ${rows.map(row => `${row.total} × ${row.pclass}²`).join(" + ")} = ${squares}. Logo, σ² = ${squares}/${n} − (${sum}/${n})² ≈ ${decimal(variance)}. Dividimos por N, não por N − 1 (ddof = 0).` },
    { title: "Raiz e coeficiente de variação", text: `σ = √[${squares}/${n} − (${sum}/${n})²] ≈ ${decimal(Math.sqrt(variance))}. CV = {√[${squares}/${n} − (${sum}/${n})²] / (${sum}/${n})} × 100% ≈ ${decimal(Math.sqrt(variance) / mean * 100)}%.` },
    { title: "Arredondamento e interpretação", text: `CV ≈ ${(Math.sqrt(variance) / mean * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%. Os valores intermediários exibidos são aproximações; o cálculo não usa esses arredondamentos. Pclass é ordinal: o CV descreve seus códigos, não uma distância econômica ou social entre classes.` },
  ];
}
type ClassRow = {
  class: string;
  pclass: number;
  survivors: number;
  deceased: number;
  total: number;
  rate: number;
  rate_label: string;
  formula: string;
};
type Passenger = {
  passenger_id: number;
  survived: 0 | 1;
  pclass: number;
  name: string;
  sex: string;
  age: number | null;
  fare: number;
  embarked: string | null;
};
type PassengerFilters = {
  pclass: "" | "1" | "2" | "3";
  survived: "" | "0" | "1";
  sex: "" | "female" | "male";
  name: string;
};
const emptyPassengerFilters: PassengerFilters = {
  pclass: "",
  survived: "",
  sex: "",
  name: "",
};
type Presentation = {
  title: string;
  subtitle: string;
  course: string;
  professor: string;
  institution: string;
  source: string;
  method: string;
  sections: Section[];
  metrics: any;
};

const number = new Intl.NumberFormat("pt-BR");
const copy = {
  cauany: {
    title: "Antes dos percentuais, existem pessoas e registros.",
    summary:
      "Para que os números contem uma história responsável, precisamos saber de quem são esses registros e como foram organizados.",
  },
  bruna: {
    title: "Entender a base é entender de onde essa história começa.",
    summary:
      "As medidas mostram como os passageiros se distribuíam entre as classes antes de compararmos seus desfechos.",
  },
  samuel: {
    title: "Na base, sobreviver não foi o desfecho mais comum.",
    summary:
      "Os 342 sobreviventes e 549 não sobreviventes revelam o cenário geral; a comparação por classe mostra como ele se reparte.",
  },
  nikson: {
    title: "A proporção revela o que a contagem sozinha não mostra.",
    summary:
      "Quando cada classe é comparada com o seu próprio total, a desigualdade observada entre os grupos aparece com precisão.",
  },
  kevin: {
    title: "Os dados tornam visível uma história que merece ser lida com cuidado.",
    summary:
      "Os cálculos evidenciam diferenças na base analisada; interpretá-las com responsabilidade exige não confundir associação com causa.",
  },
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    className: "ds-icon",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "arrow")
    return (
      <svg {...common}>
        <path d="M4 12h15" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  if (name === "back")
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </svg>
    );
  if (name === "close")
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  if (name === "sun")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (name === "moon")
    return (
      <svg {...common}>
        <path d="M20 15.3A8.4 8.4 0 0 1 8.7 4 8.4 8.4 0 1 0 20 15.3Z" />
      </svg>
    );
  if (name === "info")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10.8v5.3M12 7.7h.01" />
      </svg>
    );
  if (name === "database")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
        <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
      </svg>
    );
  if (name === "play")
    return (
      <svg {...common}>
        <path d="m9 6 9 6-9 6V6Z" />
      </svg>
    );
  if (name === "grid")
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function MetricChip({
  value,
  label,
  tone = "blue",
}: {
  value: string;
  label: string;
  tone?: string;
}) {
  return (
    <div className={`metric-chip ds-kpi-card metric-chip--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SpeakerMark({ section }: { section: Section }) {
  return (
    <div className="speaker-mark">
      <img src={section.photo} alt={`Foto de ${section.speaker}`} />
      <div>
        <span>{section.speaker}</span>
        <small>{section.role}</small>
      </div>
    </div>
  );
}

function SectionIntro({
  label,
  title,
  summary,
  light = false,
}: {
  label: string;
  title: string;
  summary: string;
  light?: boolean;
}) {
  return (
    <div className={`section-intro ${light ? "section-intro--light" : ""}`}>
      <p className="mono-label">{label}</p>
      <h2>{title}</h2>
      <p>{summary}</p>
    </div>
  );
}

function FormulaButton({
  formula,
  onOpen,
}: {
  formula: Formula;
  onOpen: (formula: Formula, event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <button
      className="formula-trigger"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(formula, event)}
    >
      <span className="formula-icon">
        <Icon name="info" size={15} />
      </span>
      <span>Ver cálculo técnico</span>
    </button>
  );
}

function Overlay({
  title,
  labelledBy,
  describedBy,
  onClose,
  children,
}: {
  title: string;
  labelledBy: string;
  describedBy?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        "button, a, [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    ).filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <div
      className="overlay ds-modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={panelRef}
        tabIndex={-1}
        className="overlay-panel ds-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
      >
        <div className="overlay-header">
          <div>
            <p className="mono-label">{title}</p>
            <h2 id={labelledBy}>{title}</h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            onClick={onClose}
            aria-label={`Fechar ${title}`}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function InstitutionalIntro({ onDone }: { onDone: () => void }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setClosing(true),
      reducedMotion ? 300 : 1600,
    );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(
      onDone,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 400,
    );
    return () => window.clearTimeout(timer);
  }, [closing, onDone]);

  return (
    <div
      className={`institutional-intro ${closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura institucional da apresentação"
    >
      <img
        className="intro-campus"
        src="/design-system/institution/unifacisa_sede.jpg"
        alt="Campus da UNIFACISA em Campina Grande"
      />
      <div className="intro-wash" aria-hidden="true" />
      <button className="intro-skip" onClick={() => setClosing(true)}>
        Pular abertura
      </button>
      <div className="intro-content t-stagger is-shown">
        <span className="intro-overline t-stagger-line t-stagger-line--1">
          Centro Universitário
        </span>
      <span className="intro-logo-wrap t-stagger-line t-stagger-line--2">
        <img
          className="intro-logo"
          src="/design-system/institution/unifacisa_logo.png"
          alt="UNIFACISA Centro Universitário"
        />
      </span>
        <span className="intro-presents t-stagger-line t-stagger-line--3">
          apresenta
        </span>
      </div>
      <span className="intro-progress" aria-hidden="true" />
    </div>
  );
}

function App() {
  const [savedSection] = useState(() => {
    try {
      return window.sessionStorage.getItem("titanic-current-section") || "hero";
    } catch {
      return "hero";
    }
  });
  const [data, setData] = useState<Presentation | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">(
    () =>
      (window.localStorage.getItem("ds-theme-onildo-v3") as "dark" | "light") ||
      "dark",
  );
  const [formula, setFormula] = useState<Formula | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [passengerPage, setPassengerPage] = useState(0);
  const [passengerTotal, setPassengerTotal] = useState(0);
  const [passengerFilters, setPassengerFilters] =
    useState<PassengerFilters>(emptyPassengerFilters);
  const [passengerLoading, setPassengerLoading] = useState(false);
  const [passengerError, setPassengerError] = useState(false);
  const [activeClass, setActiveClass] = useState(0);
  const [presentationAttempt, setPresentationAttempt] = useState(0);
  const [introVisible, setIntroVisible] = useState(savedSection === "hero");
  const restoredSection = useRef(false);
  const [sectionReady, setSectionReady] = useState(false);
  const [creditsVisible, setCreditsVisible] = useState(false);
  const creditsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!data || !creditsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setCreditsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.99);
    }, { threshold: [0, 0.99, 1] });
    observer.observe(creditsRef.current);
    return () => observer.disconnect();
  }, [data]);
  const passengerAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ds-theme-onildo-v3", theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0d0f12" : "#f5f7fa");
  }, [theme]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/presentation", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("load");
        return response.json();
      })
      .then(setData)
      .catch((loadError: unknown) => {
        if ((loadError as DOMException).name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [presentationAttempt]);
  const targets = useMemo(
    () => [
      "hero",
      "question",
      ...(data?.sections.map((section) => section.slug) ?? []),
    ],
    [data],
  );
  const navigate = (next: number) => {
    const bounded = Math.max(0, Math.min(next, targets.length - 1));
    setActive(bounded);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById(targets[bounded])
      ?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
  };

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    if (!data || restoredSection.current) return;
    const index = Math.max(0, targets.indexOf(savedSection));
    document.getElementById(targets[index])?.scrollIntoView({ behavior: "instant", block: "start" });
    setActive(index);
    if (index === 0) setIntroVisible(true);
    restoredSection.current = true;
    setSectionReady(true);
  }, [data, targets, savedSection]);

  useEffect(() => {
    if (!data || !sectionReady) return;
    try {
      window.sessionStorage.setItem("titanic-current-section", targets[active] || "hero");
    } catch { /* Presentation remains usable when browser storage is unavailable. */ }
  }, [active, data, targets, sectionReady]);

  useEffect(() => {
    if (!data) return;
    const nodes = targets
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    let frame = 0;
    const syncSection = () => {
      frame = 0;
      // Follow the incoming speaker, independent of the section's total height.
      const entranceLine = window.innerHeight * 0.9;
      let current = 0;
      for (const node of nodes) {
        const marker = node.querySelector(".speaker-mark") || node;
        const boundary = node.id === "question" && window.matchMedia("(max-width: 600px)").matches ? 80 : entranceLine;
        if (marker.getBoundingClientRect().top < boundary) {
          current = Number(node.dataset.step ?? 0);
        }
      }
      setActive(current);
    };
    const scheduleSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncSection);
    };
    scheduleSync();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
    };
  }, [data, targets]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (introVisible || formula || explorerOpen || qrOpen) return;
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          !!target.closest("[contenteditable='true']"));
      const isControlActivation =
        target?.closest("button, a, [role='button']") &&
        [" ", "Enter"].includes(event.key);
      if (isEditable || isControlActivation) return;
      if (["ArrowRight", " ", "PageDown"].includes(event.key)) {
        event.preventDefault();
        navigate(active + 1);
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        navigate(active - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        navigate(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        navigate(targets.length - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, introVisible, formula, explorerOpen, qrOpen, targets]);

  const openFormula = (item: Formula, event: MouseEvent<HTMLElement>) => {
    (event.currentTarget as HTMLElement).dataset.lastTrigger = "true";
    setFormula(item);
  };
  const loadPassengers = async (
    page: number,
    filters: PassengerFilters = passengerFilters,
  ) => {
    passengerAbortRef.current?.abort();
    const controller = new AbortController();
    passengerAbortRef.current = controller;
    setPassengerLoading(true);
    setPassengerError(false);
    try {
      const params = new URLSearchParams({
        offset: String(page * 25),
        limit: "25",
      });
      if (filters.pclass) params.set("pclass", filters.pclass);
      if (filters.survived) params.set("survived", filters.survived);
      if (filters.sex) params.set("sex", filters.sex);
      if (filters.name.trim()) params.set("name", filters.name.trim());
      const response = await fetch(`/api/passengers?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("passengers");
      const payload = await response.json();
      if (passengerAbortRef.current === controller) {
        setPassengers(payload.rows);
        setPassengerTotal(payload.total);
        setPassengerPage(page);
      }
    } catch (loadError: unknown) {
      if (
        (loadError as DOMException).name !== "AbortError" &&
        passengerAbortRef.current === controller
      ) {
        setPassengers([]);
        setPassengerError(true);
      }
    } finally {
      if (passengerAbortRef.current === controller) setPassengerLoading(false);
    }
  };
  const openExplorer = () => {
    setExplorerOpen(true);
    void loadPassengers(0);
  };
  const closeExplorer = () => {
    passengerAbortRef.current?.abort();
    setExplorerOpen(false);
  };
  const retryPresentation = () => {
    setError(false);
    setData(null);
    setPresentationAttempt((attempt) => attempt + 1);
  };
  const passengerPageCount = Math.max(1, Math.ceil(passengerTotal / 25));

  if (error)
    return (
      <main className="system-state">
        <Icon name="database" size={32} />
        <h1>Não foi possível conectar à base.</h1>
        <p>Confirme se o Docker está em execução e tente novamente.</p>
        <button className="ds-button ds-btn" onClick={retryPresentation}>
          Tentar novamente
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="system-state">
        <span className="loader-line" />
        <p>Preparando a apresentação auditável.</p>
      </main>
    );

  const overview = data.metrics.overview;
  const survival = data.metrics["survival-overview"];
  const distribution = data.metrics["class-distribution"];
  const classMetric = data.metrics["survival-by-class"];
  const classes = classMetric.rows as ClassRow[];
  const central = data.metrics["central-tendency"];
  const dispersion = data.metrics.dispersion;
  const activeSpeaker = active > 1 ? data.sections[active - 2] : undefined;
  const targetLabels = [
    "Abertura",
    "Pergunta de pesquisa",
    ...data.sections.map((section) => `Ir para ${section.speaker}`),
  ];
  const classChartLabel = `Taxas de sobrevivência por classe: ${classes.map((row) => `${row.class}, ${row.rate_label}`).join("; ")}.`;
  const distributionChartLabel = `Distribuição de passageiros por classe: ${distribution.rows.map((row: any) => `${row.class}, ${row.count} passageiros, ${row.share_label}`).join("; ")}.`;
  return (
    <div className="app-shell">
      {introVisible && (
        <InstitutionalIntro onDone={() => setIntroVisible(false)} />
      )}
      <div className="ds-scroll-progress" aria-hidden="true">
        <span
          className="ds-scroll-progress-bar"
          style={{ width: `${((active + 1) / targets.length) * 100}%` }}
        />
      </div>
      <div className="ds-bg-grid-overlay" aria-hidden="true" />
      <div className="ds-bg-radial-aurora" aria-hidden="true" />
      <div className="ds-lines-container" aria-hidden="true">
        <span className="ds-v-line" />
        <span className="ds-v-line" />
        <span className="ds-v-line" />
        <span className="ds-v-line" />
      </div>
      <header className="site-header ds-navbar-wrapper">
        <div className="ds-navbar">
          <button
            className="brand-lockup"
            onClick={() => navigate(0)}
            aria-label="Voltar ao início"
          >
            <span className="brand-mark brand-mark--image"><img src="/design-system/icone-toolbar-crop.png" alt="" width="34" height="34" /></span>
            <span>TITANIC / 1912</span>
          </button>
          <div className="header-course">{data.course}</div>
          <div className="header-tools">
            <span className="progress">
              <b>{String(active + 1).padStart(2, "0")}</b> /{" "}
              {String(targets.length).padStart(2, "0")}
            </span>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={`Mudar para tema ${theme === "dark" ? "claro" : "escuro"}`}
              aria-pressed={theme === "dark"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
          </div>
        </div>
        <div
          className="header-progress-line"
          style={
            {
              "--progress": `${((active + 1) / targets.length) * 100}%`,
            } as CSSProperties
          }
          aria-hidden="true"
        />
      </header>
      <aside className="step-rail" aria-label="Etapas da apresentação">
        {targets.map((target, index) => (
          <button
            key={target}
            className={index === active ? "step-dot is-active" : "step-dot"}
            onClick={() => navigate(index)}
            aria-label={targetLabels[index]}
            aria-current={index === active ? "step" : undefined}
          >
            <span />
          </button>
        ))}
      </aside>
      <main>
        <section id="hero" data-step="0" className="stage stage-hero ds-grid">
          <div className="hero-aurora" aria-hidden="true" />
          <div className="hero-lines" aria-hidden="true" />
          <div className="hero-layout">
            <div className={`hero-copy t-stagger ${introVisible ? "" : "is-shown"}`}>
              <div className="hero-mobile-cover">
              <div className="institution-lockup t-stagger-line t-stagger-line--1">
                <img
                  className="institution-logo"
                  src="/design-system/institution/unifacisa_logo.png"
                  alt="UNIFACISA Centro Universitário"
                />
              </div>
              <h1 className="t-stagger-line t-stagger-line--2">
                Sobrevivência <span>e Classe</span>
              </h1>
              <h2 className="hero-subtitle t-stagger-line t-stagger-line--3">
                Uma leitura humana, visual e estatística do Titanic.
              </h2>
              <p className="hero-lead t-stagger-line t-stagger-line--4">
                Uma investigação sobre a sobrevivência de{" "}
                <b>{number.format(overview.total_passengers)}</b> passageiros e
                sua relação com a classe da passagem.
              </p>
              <div className="hero-academic t-stagger-line t-stagger-line--5">
                <div>
                  <span>Professor</span>
                  <strong>{data.professor}</strong>
                </div>
                <div>
                  <span>Disciplina</span>
                  <strong>{data.course}</strong>
                </div>
                <div>
                  <span>Instituição</span>
                  <strong>{data.institution} · 223711 · Noite</strong>
                </div>
              </div>
              </div>
              <div className="hero-mobile-team">
              <h2 className="hero-team-title">Membros <span>da Equipe</span></h2>
              <div
                className="hero-team t-stagger-line t-stagger-line--6"
                aria-label="Equipe da apresentação"
              >
                {data.sections.map((section) => (
                  <button type="button" className="hero-member" key={section.slug} aria-label={`Ir para ${section.speaker}`} onClick={() => navigate(targets.indexOf(section.slug))}>
                    <span className={`hero-avatar ${section.speaker.toLowerCase().includes("nikson") ? "hero-avatar--nikson" : ""}`}>
                    <img
                      src={section.photo}
                      alt={`Foto de ${section.speaker}`}
                    />
                    </span>
                    <span>{section.speaker}</span>
                  </button>
                ))}
              </div>
              <div className="hero-actions t-stagger-line t-stagger-line--7">
                <button
                  className="ds-button ds-btn"
                  onClick={() => navigate(1)}
                >
                  <Icon name="play" size={15} /> Conhecer a análise
                </button>
              </div>
              </div>
            </div>
          </div>
          <div className="scroll-cue">
            <span>Continue para a pergunta central</span>
            <Icon name="arrow" size={16} />
          </div>
        </section>
        <section
          id="question"
          data-step="1"
          className={`stage stage-question ds-grid ${active === 1 ? "is-presenting" : ""}`}
        >
          <div className="question-stage-inner">
            <div className="opening-question-copy">
              <h2>
                Como a sobrevivência se distribui entre as classes da passagem?
              </h2>
              <p>
                Por trás de cada barra há pessoas. Quando cada classe é
                comparada com seu próprio total, os registros revelam uma
                diferença de <strong>{classMetric.gap_label}</strong> entre a
                1ª e a 3ª classe.
              </p>
            </div>
            <div
              className="opening-chart"
              role="img"
              aria-label={classChartLabel}
            >
              <div className="opening-scale" aria-hidden="true">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              <div className="opening-plot">
                {classes.map((row, index) => (
                  <div className="opening-column" key={row.class}>
                    <div className="opening-bar-area">
                      <span
                        className="opening-value"
                        style={
                          { "--height": `${row.rate * 100}%` } as CSSProperties
                        }
                      >
                        {row.rate_label}
                      </span>
                      <i
                        className={`opening-bar class-color--${index + 1}`}
                        style={
                          {
                            "--height": `${row.rate * 100}%`,
                            "--delay": `${index * 40}ms`,
                          } as CSSProperties
                        }
                      />
                    </div>
                    <strong>{row.class}</strong>
                    <small>
                      {row.survivors} de {row.total} passageiros
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className="question-handoff">
              <p>
                Para entender essa diferença, voltamos à base: quem são esses
                registros, como foram classificados e o que cada cálculo mede.
              </p>
            </div>
          </div>
          <StageNav
            previous={() => navigate(0)}
            next={() => navigate(2)}
            label="Começar pela base"
          />
        </section>
        <section
          id="cauany"
          data-step="2"
          className={`stage stage-cauany ds-grid ${active === 2 ? "is-presenting" : ""}`}
        >
          <SpeakerMark section={data.sections[0]} />
          <div className="stage-inner">
            <SectionIntro
              label="01 · DEFINIÇÃO DO RECORTE"
              title={copy.cauany.title}
              summary={copy.cauany.summary}
            />
            <div className="question-layout">
              <div className="research-question">
                <span className="question-mark">?</span>
                <p>Questão de pesquisa</p>
                <h3>
                  Como a sobrevivência se distribui entre as classes da
                  passagem?
                </h3>
                <div className="variable-list">
                  <span>
                    <b>Survived</b> 0 = não · 1 = sim
                  </span>
                  <span>
                    <b>Pclass</b> 1ª · 2ª · 3ª classe
                  </span>
                </div>
              </div>
              <div className="dataset-overview ds-card">
                <div className="panel-heading">
                  <span>A base por trás da história</span>
                  <Icon name="database" />
                </div>
                <div className="chip-grid">
                  <MetricChip
                    value={number.format(overview.total_passengers)}
                    label="passageiros"
                    tone="blue"
                  />
                  <MetricChip
                    value={String(overview.columns)}
                    label="colunas"
                    tone="purple"
                  />
                  <MetricChip
                    value={String(overview.variables_in_focus)}
                    label="em foco"
                    tone="teal"
                  />
                  <MetricChip
                    value={String(overview.missing_in_focus)}
                    label="ausências"
                    tone="green"
                  />
                </div>
                <p className="panel-note">
                  Antes de virar média, taxa ou gráfico, cada número representa
                  uma pessoa registrada na viagem. A origem e o tratamento
                  verificáveis da base permitem comparar as classes com
                  responsabilidade.
                </p>
                <button
                  className="ds-button ds-btn ds-button--ghost ds-btn--secondary"
                  onClick={openExplorer}
                >
                  <Icon name="database" size={15} /> Abrir registros da base
                </button>
              </div>
            </div>
            <p className="cauany-handoff">
              Bruna parte daqui: a distribuição entre as classes é o ponto de
              partida para interpretar a sobrevivência.
            </p>
          </div>
          <StageNav
            previous={() => navigate(1)}
            next={() => navigate(3)}
            label="Abrir medidas"
          />
        </section>
        <section id="bruna" data-step="3" className={`stage stage-bruna ${active === 3 ? "is-presenting" : ""}`}>
          <SpeakerMark section={data.sections[1]} />
          <div className="stage-inner">
            <SectionIntro
              label="02 · TENDÊNCIA CENTRAL E DISPERSÃO"
              title={copy.bruna.title}
              summary={copy.bruna.summary}
            />
            <div className="bruna-layout">
              <div className="stats-table ds-panel ds-card">
                <div className="panel-heading">
                  <span>Como a base se concentra</span>
                  <span className="panel-tag">Pclass · Survived</span>
                </div>
                <p className="human-reading human-reading--intro">
                  Os registros mostram que sobreviver não foi o resultado mais
                  comum. Para a classe, moda e mediana apontam a 3ª como a
                  experiência mais recorrente; a média apenas resume os
                  códigos.
                </p>
                <div className="table-head">
                  <span>Medida</span>
                  <span>Sobrevivência</span>
                  <span>Classe</span>
                </div>
                <div className="table-row">
                  <b>Média</b>
                  <span>{central.survived.mean_label}</span>
                  <span>{central.pclass.mean_label}</span>
                </div>
                <div className="table-row">
                  <b>Moda</b>
                  <span>{central.survived.mode} · não sobreviveu</span>
                  <span>{central.pclass.mode} · 3ª classe</span>
                </div>
                <div className="table-row">
                  <b>Mediana</b>
                  <span>{central.survived.median} · não sobreviveu</span>
                  <span>{central.pclass.median} · 3ª classe</span>
                </div>
                <div className="stat-foot">
                  <span>
                    Desvio padrão de classe <b>{dispersion.pclass.std_label}</b>
                  </span>
                  <FormulaButton
                    formula={{
                      title: "Coeficiente de variação",
                      steps: variationSteps(classes),
                      expression: `${dispersion.pclass.std_label} ÷ ${central.pclass.mean_label} × 100 = ${dispersion.pclass.cv_label}`,
                      explanation: `O desvio padrão e o CV mostram que os passageiros não se concentravam em apenas um código de classe. Eles ajudam a contextualizar a diversidade de posições na base; como Pclass é ordinal, porém, não medem uma distância social entre pessoas. ${dispersion.note}`,
                    }}
                    onOpen={openFormula}
                  />
                </div>
              </div>
              <div className="distribution-card ds-card">
                <div className="panel-heading">
                  <span>Quem ocupava cada classe</span>
                  <span className="panel-tag">
                    n = {overview.total_passengers}
                  </span>
                </div>
                <div
                  className="vertical-chart"
                  role="img"
                  aria-label={distributionChartLabel}
                >
                  {distribution.rows.map((row: any, index: number) => (
                    <div className="vertical-bar" key={row.class}>
                      <span>{row.count}</span>
                      <i
                        style={
                          {
                            "--height": `${row.share * 100}%`,
                            "--delay": `${index * 40}ms`,
                          } as CSSProperties
                        }
                        className={`class-fill class-fill--${index + 1}`}
                      />
                      <small>{row.class}</small>
                      <em>{row.share_label}</em>
                    </div>
                  ))}
                </div>
                <p className="panel-note">
                  A 3ª classe reúne mais da metade dos registros:{" "}
                  {distribution.rows[2].share_label}. Esse é o contexto para
                  ler as taxas de sobrevivência com justiça.
                </p>
              </div>
            </div>
            <p className="interpretation">
              <Icon name="info" size={16} /> A média de Pclass resume códigos
              ordinais; não representa uma distância real entre classes.
            </p>
          </div>
          <StageNav
            previous={() => navigate(2)}
            next={() => navigate(4)}
            label="Ver sobrevivência geral"
          />
        </section>
        <section
          id="samuel"
          data-step="4"
          className={`stage stage-samuel ds-grid ${active === 4 ? "is-presenting" : ""}`}
        >
          <div className="samuel-glow" aria-hidden="true" />
          <SpeakerMark section={data.sections[2]} />
          <div className="stage-inner">
            <SectionIntro
              light
              label="03 · RESULTADO GERAL"
              title={copy.samuel.title}
              summary={copy.samuel.summary}
            />
            <div className="survival-panel">
              <div className="survival-side survival-side--yes">
                <span className="survival-number">
                  {number.format(survival.survived)}
                </span>
                <div>
                  <strong>sobreviveram</strong>
                  <small>{survival.survival_rate_label} da base</small>
                </div>
              </div>
              <div className="survival-compare">
                <div className="split-track">
                  <span
                    style={
                      {
                        "--share": `${survival.survival_rate * 100}%`,
                      } as CSSProperties
                    }
                  />
                  <i />
                </div>
                <div className="split-labels">
                  <span>1 · sobreviveu</span>
                  <span>0 · não sobreviveu</span>
                </div>
              </div>
              <div className="survival-side survival-side--no">
                <span className="survival-number">
                  {number.format(survival.deceased)}
                </span>
                <div>
                  <strong>não sobreviveram</strong>
                  <small>{survival.deceased_rate_label} da base</small>
                </div>
              </div>
            </div>
            <div className="samuel-bottom">
              <p>
              O resultado geral mostra o desfecho da base, mas ainda não diz
              como essa experiência se distribuiu entre os grupos.
              </p>
              <FormulaButton
                formula={{
                  title: "Taxa geral de sobrevivência",
                  steps: rateSteps(classes.reduce((sum, row) => sum + row.survivors, 0), classes.reduce((sum, row) => sum + row.total, 0)),
                  expression: survival.formula,
                  explanation: `A proporção considera todos os ${number.format(overview.total_passengers)} registros da base: sobreviventes divididos pelo total, multiplicado por 100. Na história geral destes registros, ela mostra que sobreviver não foi o desfecho mais frequente — mas ainda não explica por que os grupos tiveram resultados diferentes.`,
                }}
                onOpen={openFormula}
              />
            </div>
          </div>
          <StageNav
            previous={() => navigate(3)}
            next={() => navigate(5)}
            label="Comparar as classes"
            light
          />
        </section>
        <section id="nikson" data-step="5" className={`stage stage-nikson ${active === 5 ? "is-presenting" : ""}`}>
          <SpeakerMark section={data.sections[3]} />
          <div className="stage-inner">
            <SectionIntro
              label="04 · ANÁLISE CONJUNTA"
              title={copy.nikson.title}
              summary={copy.nikson.summary}
            />
            <div className="comparison-layout">
              <div className="comparison-chart ds-panel">
                <div className="panel-heading">
                  <span>Sobrevivência dentro de cada classe</span>
                  <span className="panel-tag">clique para destacar</span>
                </div>
                <div className="class-rows">
                  {classes.map((row, index) => (
                    <button
                      className={
                        activeClass === index
                          ? "class-row is-selected"
                          : "class-row"
                      }
                      key={row.class}
                      onClick={() => setActiveClass(index)}
                      aria-pressed={activeClass === index}
                    >
                      <span className={`class-index class-index--${index + 1}`}>
                        0{index + 1}
                      </span>
                      <span className="class-name">{row.class}</span>
                      <span className="class-track">
                        <i
                          style={
                            { "--width": `${row.rate * 100}%` } as CSSProperties
                          }
                          className={`class-rate class-rate--${index + 1}`}
                        />
                      </span>
                      <strong>{row.rate_label}</strong>
                      <small>
                        {row.survivors} de {row.total} passageiros
                      </small>
                    </button>
                  ))}
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="legend-dot legend-dot--survived" /> sobreviveu
                  </span>
                  <span>
                    <i className="legend-dot legend-dot--deceased" /> não
                    sobreviveu
                  </span>
                </div>
              </div>
              <aside className="finding-panel">
                <p className="mono-label">Diferença decisiva</p>
                <strong>{classMetric.gap_label}</strong>
                <p>entre a 1ª e a 3ª classe, antes do arredondamento.</p>
                <div className="finding-selected">
                  <span>Classe destacada</span>
                  <b>{classes[activeClass].class}</b>
                  <em>{classes[activeClass].formula}</em>
                </div>
                <FormulaButton
                  formula={{
                    title: `Taxa da ${classes[activeClass].class}`,
                    steps: rateSteps(classes[activeClass].survivors, classes[activeClass].total),
                    expression: classes[activeClass].formula,
                    explanation:
                      "A taxa usa o total da própria classe como denominador. Assim, comparamos a sobrevivência dentro da realidade de cada grupo, e não apenas contagens diferentes.",
                  }}
                  onOpen={openFormula}
                />
              </aside>
            </div>
            <div className="distribution-strip">
              <span>De onde vêm os grupos comparados</span>
              {distribution.rows.map((row: any) => (
                <b key={row.class}>
                  {row.class}{" "}
                  <i>
                    {row.count} · {row.share_label}
                  </i>
                </b>
              ))}
            </div>
          </div>
          <StageNav
            previous={() => navigate(4)}
            next={() => navigate(6)}
            label="Ler conclusões"
          />
        </section>
        <section id="kevin" data-step="6" className={`stage stage-kevin ds-grid ${active === 6 ? "is-presenting" : ""}`}>
          <div className="kevin-glow" aria-hidden="true" />
          <SpeakerMark section={data.sections[4]} />
          <div className="stage-inner">
            <SectionIntro
              light
              label="05 · CONCLUSÕES E LIMITES"
              title={copy.kevin.title}
              summary={copy.kevin.summary}
            />
            <div className="conclusion-layout">
              <div className="conclusion-list">
                <article>
                  <span>01</span>
                  <div>
                    <h3>A sobrevivência foi minoritária.</h3>
                    <p>
                      {number.format(survival.survived)} de{" "}
                      {number.format(overview.total_passengers)} passageiros
                      sobreviveram: {survival.survival_rate_label} dos registros
                      analisados.
                    </p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <h3>As classes tiveram resultados diferentes.</h3>
                    <p>
                      {classes
                        .map((row) => `${row.rate_label} na ${row.class}`)
                        .join(", ")}
                      .
                    </p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h3>Medidas e gráficos ajudam a ler a mesma história.</h3>
                    <p>
                      Os números organizam os registros; as distribuições e
                      taxas mostram como sobrevivência e classe se encontram
                      na base.
                    </p>
                  </div>
                </article>
              </div>
              <div className="method-panel ds-card">
                <div className="panel-heading">
                  <span>Leitura responsável</span>
                  <Icon name="info" />
                </div>
                <p>
                  Sexo, idade e outras condições também podem estar ligados ao
                  resultado. Esta análise descreve uma associação na base, não
                  explica sozinha todas as causas dessa história.
                </p>
                <div className="method-lines">
                  <span>
                    Fonte{" "}
                    <b>Kaggle · Titanic — Machine Learning from Disaster</b>
                  </span>
                  <span>
                    Método{" "}
                    <b>Python/Pandas · desvio padrão populacional (ddof = 0)</b>
                  </span>
                </div>
                <button
                  className="ds-button ds-btn ds-button--ghost ds-btn--secondary"
                  onClick={openExplorer}
                >
                  <Icon name="database" size={15} /> Explorar registros
                </button>
              </div>
            </div>
            <div className="team-credit" ref={creditsRef}>
              <span>Apresentação por</span>
              {data.sections.map((section) => (
                <button type="button" key={section.slug} aria-label={`Ir para ${section.speaker}`} onClick={() => navigate(targets.indexOf(section.slug))}>
                  <img src={section.photo} alt="" />
                  <b>{section.speaker.split(" ")[0]}</b>
                </button>
              ))}
            </div>
          </div>
          <StageNav
            previous={() => navigate(5)}
            next={() => navigate(0)}
            label="Recomeçar"
            light
          />
        </section>
      </main>
      {activeSpeaker && (
        <div className={`speaker-chip ${creditsVisible ? "speaker-chip--hidden" : ""}`} aria-hidden={creditsVisible}>
          <img src={activeSpeaker.photo} alt="" />
          <span>{activeSpeaker.speaker}</span>
        </div>
      )}
      {active === 0 && !introVisible && (
        <button type="button" className="qr-launcher icon-button" aria-label="Ampliar QR Code para acessar o site" aria-haspopup="dialog" onClick={() => setQrOpen(true)} title="Abrir QR Code">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" />
            <path d="M15 15h3v3h3v3h-6v-3M21 12v3M12 3v3M3 12h6M12 12v6M12 21h1" />
          </svg>
        </button>
      )}
      {qrOpen && (
        <Overlay title="Acompanhe pelo celular" labelledBy="qr-title" describedBy="qr-instructions" onClose={() => setQrOpen(false)}>
          <div className="qr-share">
            <p id="qr-instructions">Aponte a câmera para o QR Code e abra a apresentação.</p>
            <QRCodeSVG value={PUBLIC_SITE_URL} size={560} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" title="QR Code para o site Titanic — Sobrevivência e Classe" />
            <a href={PUBLIC_SITE_URL} target="_blank" rel="noopener noreferrer">titanic-sobrevivencia-e-classe.vercel.app</a>
          </div>
        </Overlay>
      )}
      {formula && (
        <Overlay
          title="Memória técnica do cálculo"
          labelledBy="formula-overlay-title"
          onClose={() => setFormula(null)}
        >
          <div className="formula-body">
            <h3>{formula.title}</h3>
            <p className="formula-expression">{formula.expression}</p>
            <ol className="calculation-steps">
              {formula.steps.map(step => <li key={step.title}><h4>{step.title}</h4><p>{step.text}</p></li>)}
            </ol>
          </div>
        </Overlay>
      )}
      {explorerOpen && (
        <Overlay
          title="Explorador da base"
          labelledBy="explorer-panel-title"
          describedBy="explorer-dialog-description"
          onClose={closeExplorer}
        >
          <div className="explorer-body">
            <p id="explorer-dialog-description" className="explorer-intro">
              Consulte e filtre os registros reais usados nos cálculos. Foram
              encontrados {number.format(passengerTotal)} registros. Página{" "}
              {passengerPage + 1} de {passengerPageCount}.
            </p>
            <form
              className="explorer-filters"
              onSubmit={(event) => {
                event.preventDefault();
                void loadPassengers(0);
              }}
            >
              <label>
                <span>Classe</span>
                <select
                  value={passengerFilters.pclass}
                  onChange={(event) =>
                    setPassengerFilters((filters) => ({
                      ...filters,
                      pclass: event.target.value as PassengerFilters["pclass"],
                    }))
                  }
                >
                  <option value="">Todas</option>
                  <option value="1">1ª classe</option>
                  <option value="2">2ª classe</option>
                  <option value="3">3ª classe</option>
                </select>
              </label>
              <label>
                <span>Resultado</span>
                <select
                  value={passengerFilters.survived}
                  onChange={(event) =>
                    setPassengerFilters((filters) => ({
                      ...filters,
                      survived: event.target.value as PassengerFilters["survived"],
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="1">Sobreviveu</option>
                  <option value="0">Não sobreviveu</option>
                </select>
              </label>
              <label>
                <span>Sexo</span>
                <select
                  value={passengerFilters.sex}
                  onChange={(event) =>
                    setPassengerFilters((filters) => ({
                      ...filters,
                      sex: event.target.value as PassengerFilters["sex"],
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </label>
              <label className="explorer-filter-search">
                <span>Nome</span>
                <input
                  type="search"
                  value={passengerFilters.name}
                  onChange={(event) =>
                    setPassengerFilters((filters) => ({
                      ...filters,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Buscar passageiro"
                />
              </label>
              <div className="explorer-filter-actions">
                <button className="ds-button ds-btn ds-button--quiet" type="submit">
                  Aplicar filtros
                </button>
                <button
                  className="ds-button ds-btn ds-button--quiet"
                  type="button"
                  onClick={() => {
                    setPassengerFilters(emptyPassengerFilters);
                    void loadPassengers(0, emptyPassengerFilters);
                  }}
                >
                  Limpar
                </button>
              </div>
            </form>
            <p className="sr-only" aria-live="polite" role="status">
              {passengerLoading
                ? "Carregando registros"
                : passengerError
                  ? "Não foi possível carregar os registros"
                  : `Página ${passengerPage + 1} de ${passengerPageCount} carregada`}
            </p>
            <div className="explorer-table-wrap" aria-busy={passengerLoading}>
              <table>
                <caption className="sr-only">Registros da base Titanic</caption>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Nome</th>
                    <th scope="col">Classe</th>
                    <th scope="col">Resultado</th>
                    <th scope="col">Sexo</th>
                    <th scope="col">Idade</th>
                    <th scope="col">Tarifa (unidade da base)</th>
                  </tr>
                </thead>
                <tbody>
                  {passengerLoading ? (
                    <tr>
                      <td colSpan={7}>Carregando registros…</td>
                    </tr>
                  ) : passengerError ? (
                    <tr>
                      <td colSpan={7}>
                        <span>Não foi possível carregar os registros.</span>{" "}
                        <button
                          className="ds-button ds-btn ds-button--quiet ds-btn--quiet"
                          onClick={() => void loadPassengers(passengerPage)}
                        >
                          Tentar novamente
                        </button>
                      </td>
                    </tr>
                  ) : (
                    passengers.map((row) => (
                      <tr key={row.passenger_id}>
                        <td>{row.passenger_id}</td>
                        <td>{row.name}</td>
                        <td>{row.pclass}ª</td>
                        <td>
                          <span
                            className={`result-badge result-badge--${row.survived}`}
                          >
                            {row.survived ? "sobreviveu" : "não sobreviveu"}
                          </span>
                        </td>
                        <td>{row.sex}</td>
                        <td>
                          {row.age == null
                            ? "—"
                            : row.age.toFixed(1).replace(".", ",")}
                        </td>
                        <td>{number.format(row.fare)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="explorer-controls">
              <button
                className="ds-button ds-btn ds-button--quiet ds-btn--quiet"
                onClick={() =>
                  void loadPassengers(Math.max(0, passengerPage - 1))
                }
                disabled={passengerLoading || passengerPage === 0}
              >
                <Icon name="back" size={15} /> Anterior
              </button>
              <button
                className="ds-button ds-btn ds-button--quiet ds-btn--quiet"
                onClick={() =>
                  void loadPassengers(
                    Math.min(passengerPageCount - 1, passengerPage + 1),
                  )
                }
                disabled={
                  passengerLoading || passengerPage >= passengerPageCount - 1
                }
              >
                Próxima <Icon name="arrow" size={15} />
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function StageNav({
  previous,
  next,
  label,
  light = false,
}: {
  previous: () => void;
  next: () => void;
  label: string;
  light?: boolean;
}) {
  return (
    <nav
      className={`stage-nav ds-section-nav ${light ? "stage-nav--light" : ""}`}
      aria-label="Navegação da seção"
    >
      <button className="prev-control" onClick={previous}>
        <Icon name="back" size={15} /> Voltar
      </button>
      <button className="next-control" onClick={next}>
        {label} <Icon name="arrow" size={15} />
      </button>
    </nav>
  );
}

export default App;
