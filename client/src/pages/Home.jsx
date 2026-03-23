import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { resumeTemplates } from "../data/templates.js";

const featureCards = [
  {
    eyebrow: "Import",
    title: "Start with the resume you already have",
    description: "Paste older resume text, clean up the structure, and turn scattered details into editable sections fast.",
  },
  {
    eyebrow: "Polish",
    title: "Refine headlines, summaries, and skills",
    description: "Use the built-in optimizer to tighten language, surface stronger keywords, and prepare for a target role.",
  },
  {
    eyebrow: "Share",
    title: "Publish a clean public link when ready",
    description: "Keep drafts private while editing, then switch on a live URL for recruiters, clients, or referrals.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Choose a visual direction",
    description: "Pick a template mood that matches the role you are pursuing before you start editing.",
  },
  {
    step: "02",
    title: "Build and iterate in one place",
    description: "Edit details, preview the layout live, and keep your resume content and design in sync.",
  },
  {
    step: "03",
    title: "Tailor each draft with purpose",
    description: "Create role-specific versions instead of forcing one generic resume to do every job.",
  },
];

const FooterIcon = ({ name }) => {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    globe: (
      <path d="M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19Zm-7 9.5h14M12 2.5c2.4 2.6 3.7 6 3.7 9.5S14.4 18.9 12 21.5M12 2.5c-2.4 2.6-3.7 6-3.7 9.5s1.3 6.9 3.7 9.5" />
    ),
    linkedin: (
      <>
        <path d="M7.5 9.2v7.3" />
        <path d="M7.5 6.8h.01" />
        <path d="M11.2 16.5v-4.1a2.2 2.2 0 1 1 4.4 0v4.1" />
        <path d="M11.2 12.1v-2.9" />
      </>
    ),
    twitter: (
      <path d="M19 7.2c-.5.3-1 .5-1.6.6a2.8 2.8 0 0 0-4.8 2v.6a7.8 7.8 0 0 1-5.7-2.9a2.8 2.8 0 0 0 .9 3.7c-.4 0-.8-.1-1.1-.3c0 1.4 1 2.6 2.4 2.9c-.4.1-.8.1-1.2 0c.3 1.2 1.5 2.1 2.8 2.1A5.7 5.7 0 0 1 6 17.3a7.9 7.9 0 0 0 12.2-6.7v-.3c.5-.4.9-.9 1.2-1.5Z" />
    ),
    play: (
      <>
        <rect x="3.8" y="6.5" width="16.4" height="11" rx="3" />
        <path d="m10.7 9.7 4.6 2.3-4.6 2.3Z" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g {...commonProps}>{icons[name]}</g>
    </svg>
  );
};

const Home = () => {
  const { token } = useAuth();
  const primaryHref = token ? "/dashboard" : "/signup";
  const primaryLabel = token ? "Open Dashboard" : "Create Your Resume";
  const secondaryHref = token ? "/dashboard" : "/login";
  const secondaryLabel = token ? "Continue Editing" : "Log In";
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { label: "Google", href: "https://www.google.com", icon: "globe" },
    { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
    { label: "Twitter", href: "https://x.com", icon: "twitter" },
    { label: "YouTube", href: "https://www.youtube.com", icon: "play" },
  ];
  const footerColumns = [
    {
      title: "Product",
      items: [
        { label: "Home", to: "/" },
        { label: "Templates", href: "#templates" },
        { label: "Workflow", href: "#workflow" },
        { label: primaryLabel, to: primaryHref },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Features", href: "#features" },
        { label: "Contact", href: "#contact" },
        { label: secondaryLabel, to: secondaryHref },
        { label: "Live Preview", badge: "New" },
      ],
    },
    {
      title: "Legal",
      items: [{ label: "Privacy" }, { label: "Terms" }],
    },
  ];

  const renderFooterItem = (item) => {
    const content = (
      <>
        <span>{item.label}</span>
        {item.badge ? <em>{item.badge}</em> : null}
      </>
    );

    if (item.to) {
      return (
        <Link key={item.label} className="home-footer-link" to={item.to}>
          {content}
        </Link>
      );
    }

    if (item.href) {
      return (
        <a key={item.label} className="home-footer-link" href={item.href}>
          {content}
        </a>
      );
    }

    return (
      <span key={item.label} className="home-footer-link muted-only">
        {content}
      </span>
    );
  };

  return (
    <div className="home-page">
      <header className="home-nav card">
        <div className="home-brand">
          <span className="home-brand-mark">AR</span>
          <div>
            <p className="eyebrow">AI Resume Builder</p>
            <strong>Design, edit, and share polished resumes.</strong>
          </div>
        </div>

        <nav className="home-nav-links" aria-label="Home">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#workflow">Workflow</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="home-nav-actions">
          <Link className="ghost home-nav-button" to={secondaryHref}>
            {secondaryLabel}
          </Link>
          <Link className="home-nav-button home-nav-button-primary" to={primaryHref}>
            {primaryLabel}
          </Link>
        </div>
      </header>

      <section className="home-hero card">
        <div className="home-hero-copy">
          <p className="eyebrow">Resume Studio</p>
          <h1>Create resumes that feel considered, current, and ready to send.</h1>
          <p className="muted">
            Build role-specific resumes with live preview, cleaner structure, public share links, and AI-assisted editing
            that helps you move from rough draft to presentation-ready faster.
          </p>

          <div className="home-hero-actions">
            <Link to={primaryHref}>{primaryLabel}</Link>
            <Link className="ghost" to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          <div className="home-proof-row">
            <article className="home-proof-card">
              <span>Live preview</span>
              <strong>Edit content and layout together</strong>
            </article>
            <article className="home-proof-card">
              <span>Public links</span>
              <strong>Share a clean recruiter-friendly view</strong>
            </article>
            <article className="home-proof-card">
              <span>Template moods</span>
              <strong>Bold, editorial, and minimal styles</strong>
            </article>
          </div>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-orbit home-orbit-one" />
          <div className="home-orbit home-orbit-two" />

          <div className="home-preview-stage">
            <article className="home-preview-panel">
              <div className="home-preview-header">
                <span className="home-preview-badge">Live resume preview</span>
                <span className="home-preview-badge accent">ATS-friendly edits</span>
              </div>

              <div className="home-preview-sheet-ui">
                <div className="home-sheet-header">
                  <div>
                    <div className="home-sheet-line wide" />
                    <div className="home-sheet-line mid" />
                  </div>
                  <div className="home-sheet-avatar" />
                </div>

                <div className="home-sheet-chip-row">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="home-sheet-grid">
                  <div className="home-sheet-card large">
                    <div className="home-sheet-line wide" />
                    <div className="home-sheet-line mid" />
                    <div className="home-sheet-line short" />
                  </div>
                  <div className="home-sheet-card">
                    <div className="home-sheet-line mid" />
                    <div className="home-sheet-line short" />
                    <div className="home-sheet-pill-row">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="home-floating-card home-floating-card-top">
              <p className="eyebrow">Template switch</p>
              <strong>Change the look without redoing the content.</strong>
            </article>

            <article className="home-floating-card home-floating-card-bottom">
              <p className="eyebrow">Share mode</p>
              <strong>Publish only the resumes you want people to see.</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section" id="features">
        <div className="home-section-head">
          <div>
            <p className="eyebrow">Features</p>
            <h2>Everything important stays in one editing flow.</h2>
          </div>
          <p className="muted">
            The app is built for people who want a single place to write, refine, preview, and publish without bouncing
            between tools.
          </p>
        </div>

        <div className="home-feature-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="home-feature-card card">
              <p className="eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p className="muted">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" id="templates">
        <div className="home-section-head">
          <div>
            <p className="eyebrow">Templates</p>
            <h2>Pick a visual tone that matches the story you want to tell.</h2>
          </div>
        </div>

        <div className="home-template-grid">
          {resumeTemplates.map((template) => (
            <article key={template.id} className="home-template-card card" style={{ "--template-accent": template.accent }}>
              <div className="home-template-card-top">
                <span className="home-template-dot" />
                <p className="eyebrow">{template.mood}</p>
              </div>
              <h3>{template.name}</h3>
              <p className="muted">{template.description}</p>
              <div className="home-template-preview">
                <div className="home-template-preview-bar" />
                <div className="home-template-preview-block" />
                <div className="home-template-preview-row">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" id="workflow">
        <div className="home-section-head">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>A calmer path from draft to ready-to-send.</h2>
          </div>
        </div>

        <div className="home-step-grid">
          {workflowSteps.map((item) => (
            <article key={item.step} className="home-step-card card">
              <span className="home-step-number">{item.step}</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta card">
        <div>
          <p className="eyebrow">Get Started</p>
          <h2>Open the workspace and start shaping your next resume.</h2>
          <p className="muted">Keep your draft private while you build, then share a polished public version when it is ready.</p>
        </div>

        <div className="home-cta-actions">
          <Link to={primaryHref}>{primaryLabel}</Link>
          <Link className="ghost" to={secondaryHref}>
            {secondaryLabel}
          </Link>
        </div>
      </section>

      <footer className="home-footer card" id="contact">
        <div className="home-footer-brand">
          <Link className="home-footer-logo" to="/">
            <span>resume</span>
            <i />
          </Link>
        </div>

        <div className="home-footer-columns">
          {footerColumns.map((column) => (
            <div key={column.title} className="home-footer-column">
              <h3>{column.title}</h3>
              <div className="home-footer-link-list">{column.items.map(renderFooterItem)}</div>
            </div>
          ))}
        </div>

        <div className="home-footer-aside">
          <p className="home-footer-note">
            Making every resume feel clearer and easier to share, no matter where you start.
          </p>

          <div className="home-footer-social" aria-label="Social links">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                className="home-social-icon"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                <FooterIcon name={item.icon} />
              </a>
            ))}
          </div>

          <p className="home-footer-copy">© {currentYear} Resume Builder</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
