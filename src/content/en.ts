import type { Content } from "./types";

/**
 * İngilizce içerik. CV'deki (docs/CV.pdf) İngilizce ifadeler birebir
 * kullanıldı; CV'de olmayan site metinleri doğal İngilizce.
 */
export const en: Content = {
  locale: "en",
  meta: {
    siteTitle: "Eren Osma — Portfolio",
    description:
      "Eren Osma — mathematics student and aspiring data scientist. Machine learning, industrial data and AI projects.",
    aboutTitle: "About Me",
    aboutDescription: "Eren Osma: education, experience and certifications.",
    projectsTitle: "Projects",
    projectsDescription:
      "Projects by Eren Osma: a predictive maintenance platform, a financial behavior simulator and a stock trend predictor.",
  },
  nav: {
    ariaLabel: "Main menu",
    labels: {
      about: "About",
      projects: "Projects",
      writings: "Writings",
      roadmap: "Roadmap",
      contact: "Contact",
    },
    menu: "Menu",
    close: "Close",
    onThisPage: "On this page",
  },
  intro: {
    kicker: "Eren Osma",
    heading: "Hello — this is my corner of the web.",
    scrollLabel: "Scroll down",
  },
  landing: {
    srTitle: "Eren Osma — Portfolio",
    about: {
      title: "About Me",
      body: "Mathematics student working on data science and machine learning. A short introduction, education, experience and certifications are on the next page.",
    },
    projects: {
      title: "Projects",
      body: "Three projects: industrial predictive maintenance, financial behavior simulation and stock trend prediction.",
    },
    writings: {
      title: "Writings",
      body: "Medium-style writing cards will be listed here. Placeholder content for now.",
    },
    roadmap: {
      title: "Roadmap",
      body: "Internships, projects and writings on one road — what is done, and what comes next.",
    },
    contact: {
      title: "Contact",
      body: "Contact section. Placeholder content for now.",
    },
    readMore: "Read more →",
  },
  common: {
    keywords: "Keywords — ",
    nextSection: "Next section",
    home: "← Home",
  },
  about: {
    title: "About Me",
    location: "İstanbul / Güngören",
    language: "English — C1",
    definitionLabel: "Definition 1.1",
    definitionName: "(Eren Osma).",
    summary:
      "Aspiring Data Scientist with a strong foundation in machine learning principles and data analysis, currently completing my Mathematics degree. My core competencies include leveraging Python to process data and build predictive models, along with a solid command of SQL for database querying. I've also worked with modern AI tools and agentic workflows to support and accelerate analysis. I am a proactive learner, passionate about uncovering insights from complex datasets, and looking for an opportunity to grow and contribute my skills in a professional environment.",
    contact: { email: "Email", phone: "Phone", cv: "CV", cvLink: "Download CV (PDF)" },
    sections: {
      aboutMe: "About Me",
      education: "Education",
      experiences: "Experiences",
      certifications: "Certifications",
    },
    education: {
      university: "Yıldız Technical University",
      degree: "Mathematics",
      period: "2022 – 2027",
    },
    experiences: [
      {
        org: "TREX",
        role: "Data Science Intern",
        period: "Aug 2026 – Oct 2026",
        bullets: [
          "Reconstructed an industrial telemetry dataset into an analysis-ready pipeline, correcting coverage gaps, sensor artifacts, and inconsistent failure labeling.",
          "Engineered a leakage-free feature set and evaluated a LightGBM risk-classification model across walk-forward folds with alarm-budget-constrained thresholds.",
          "Diagnosed confounded features and regime shifts via systematic ablation to separate genuine signal from data artifacts.",
          "Benchmarked alternative modeling approaches (survival analysis, time-series foundation models) and presented trade-offs to guide adoption decisions.",
        ],
        tags: ["Python", "Machine Learning", "Data Management", "SQL/MSSQL"],
      },
      {
        org: "İletişim Software",
        role: "Data Science Intern",
        period: "Jul 2026 – Aug 2026",
        bullets: [
          "Cleaned and validated industrial sensor data, resolving calibration drift, placeholder records, and misattributed machine-state transitions.",
          "Built and benchmarked RUL prediction models: regression, classification, Cox proportional hazards, and LSTM.",
          "Conducted literature and dataset review to guide modeling approach.",
          "Authored technical report summarizing methodology and findings for stakeholders.",
        ],
        tags: ["Python", "Deep Learning", "Data Management"],
      },
      {
        org: "Google AI & Technology Academy",
        role: "Fellow (Data Science Track)",
        period: "Dec 2025 – Sep 2026",
        bullets: [
          "Selected for an intensive, highly competitive fellowship program focused on Advanced Data Analytics and AI development.",
        ],
        tags: ["Machine Learning", "Deep Learning", "AI Agents / LLMs"],
      },
      {
        org: "The Inn Restaurant (MI, USA)",
        role: "Cook",
        period: "Summer 2025",
        bullets: [],
        tags: [],
      },
      {
        org: "Food Lion (NC, USA)",
        role: "Retail Associate",
        period: "Summer 2024",
        bullets: [],
        tags: [],
      },
    ],
    remarkLabel: "Remark 1.3.",
    experienceToggle: { show: "Show details", hide: "Hide details" },
    certifications: [
      "Google Data Analytics Professional Certificate",
      "Google Advanced Data Analytics Professional Certificate",
    ],
  },
  projects: {
    title: "Projects",
    figureLabel: "Figure",
    items: [
      {
        id: "predictive-maintenance",
        title: "Predictive Maintenance Dashboard",
        statement:
          "Built an industrial predictive maintenance platform combining ML-based fault detection with a LangGraph multi-agent fleet simulation.",
        keywords: ["Machine Learning", "Fault Detection", "LangGraph", "Multi-agent"],
        figure: "anomaly",
        caption: "Anomaly signal: spikes that leave the threshold band are marked.",
      },
      {
        id: "finsim",
        title: "Finsim: Financial Behavior Simulator",
        statement:
          "A gamified platform simulating life events and investment strategies to improve financial literacy through AI-powered feedback.",
        keywords: ["Simulation", "Gamification", "AI Feedback"],
        figure: "montecarlo",
        caption: "Monte Carlo fan: 42 paths from a single root, with the expected value and a ±σ√t envelope.",
      },
      {
        id: "neuroquant",
        title: "NeuroQuant Stock Predictor",
        statement:
          "Developed a live dashboard predicting stock trends using Deep Learning and Sentiment Analysis.",
        keywords: ["Deep Learning", "Sentiment Analysis", "Dashboard"],
        figure: "network",
        caption: "Layered network: the signal travels layer by layer.",
      },
    ],
  },
  roadmap: {
    ariaLabel: "Roadmap timeline",
    today: "Today",
    planned: "Planned",
    open: "Open →",
    allEntries: "More roadmap entries (outside the current view)",
    scale: { label: "Scale", near: "Near", far: "Far" },
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    kinds: { internship: "Internship", project: "Project", writing: "Writing" },
  },
  notFound: {
    title: "Page not found",
    lemmaLabel: "Lemma.",
    lemma: "The requested address is not in the domain of this site.",
    proofLabel: "Proof.",
    proof: "The link is outdated or contains a typo. ∎",
  },
};
