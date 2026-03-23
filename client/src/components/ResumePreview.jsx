import { getTemplateById } from "../data/templates.js";

const hasContent = (value) => {
  if (Array.isArray(value)) return value.some(hasContent);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasContent);
  }

  return Boolean(typeof value === "string" ? value.trim() : value);
};

const formatRange = (start, end) => [start, end].filter(Boolean).join(" - ");

const renderContactItem = (label, value, href) => {
  if (!value) return null;

  return href ? (
    <a key={label} className="preview-chip preview-chip-link" href={href} target="_blank" rel="noreferrer">
      {value}
    </a>
  ) : (
    <span key={label} className="preview-chip">
      {value}
    </span>
  );
};

const ResumePreview = ({ resume }) => {
  const template = getTemplateById(resume?.templateId);
  const accent = resume?.accentColor || template.accent;
  const avatarUrl = resume?.profileImage?.backgroundRemovedUrl || resume?.profileImage?.url;
  const experience = (resume?.experience || []).filter(hasContent);
  const education = (resume?.education || []).filter(hasContent);
  const projects = (resume?.projects || []).filter(hasContent);
  const skills = (resume?.skills || []).filter(Boolean);

  return (
    <div className={`resume-preview template-${template.id}`}>
      <div className="preview-sheet" style={{ "--accent": accent }}>
        <div className="preview-orbit" />

        <header className="preview-hero">
          <div className="preview-copy">
            <p className="preview-kicker">
              {template.name} template
              <span>{template.mood}</span>
            </p>
            <h1>{resume?.ownerName || resume?.title || "Your Name"}</h1>
            <p className="preview-role">{resume?.headline || "Professional headline goes here"}</p>
            <p className="preview-summary">
              {resume?.summary || "Add a concise summary to showcase your impact, focus, and strengths."}
            </p>
          </div>

          {avatarUrl ? (
            <div className="preview-avatar-shell">
              <img className="preview-avatar" src={avatarUrl} alt={resume?.ownerName || "Profile"} />
            </div>
          ) : null}
        </header>

        <div className="preview-contact">
          {renderContactItem("email", resume?.contact?.email, resume?.contact?.email ? `mailto:${resume.contact.email}` : "")}
          {renderContactItem("phone", resume?.contact?.phone)}
          {renderContactItem("location", resume?.contact?.location)}
          {renderContactItem("website", resume?.contact?.website, resume?.contact?.website)}
          {renderContactItem(
            "linkedin",
            resume?.contact?.linkedin?.replace(/^https?:\/\//, ""),
            resume?.contact?.linkedin
          )}
        </div>

        <div className="preview-grid">
          {skills.length ? (
            <section className="preview-section">
              <div className="preview-section-title">Skills</div>
              <div className="preview-skill-list">
                {skills.map((skill) => (
                  <span key={skill} className="preview-skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {experience.length ? (
            <section className="preview-section preview-section-wide">
              <div className="preview-section-title">Experience</div>
              <div className="preview-item-stack">
                {experience.map((item) => (
                  <article key={item._id || item.clientKey} className="preview-item-card">
                    <div className="preview-item-head">
                      <div>
                        <h3>{item.role || "Role"}</h3>
                        <p>{[item.company, item.location].filter(Boolean).join(" | ")}</p>
                      </div>
                      <span>{formatRange(item.startDate, item.endDate) || "Timeline"}</span>
                    </div>
                    {item.description ? <p className="preview-item-body">{item.description}</p> : null}
                    {item.achievements?.length ? (
                      <ul className="preview-bullet-list">
                        {item.achievements.map((achievement, index) => (
                          <li key={`${item._id || item.clientKey}-${index}`}>{achievement}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {projects.length ? (
            <section className="preview-section">
              <div className="preview-section-title">Projects</div>
              <div className="preview-item-stack compact">
                {projects.map((item) => (
                  <article key={item._id || item.clientKey} className="preview-item-card">
                    <div className="preview-item-head">
                      <div>
                        <h3>{item.name || "Project"}</h3>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noreferrer">
                            {item.link.replace(/^https?:\/\//, "")}
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {item.description ? <p className="preview-item-body">{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {education.length ? (
            <section className="preview-section">
              <div className="preview-section-title">Education</div>
              <div className="preview-item-stack compact">
                {education.map((item) => (
                  <article key={item._id || item.clientKey} className="preview-item-card">
                    <div className="preview-item-head">
                      <div>
                        <h3>{item.degree || "Degree"}</h3>
                        <p>{[item.school, item.location].filter(Boolean).join(" | ")}</p>
                      </div>
                      <span>{formatRange(item.startDate, item.endDate)}</span>
                    </div>
                    {item.description ? <p className="preview-item-body">{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
