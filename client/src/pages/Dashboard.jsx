import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ResumePreview from "../components/ResumePreview.jsx";
import { getTemplateById, resumeTemplates } from "../data/templates.js";
import {
  createEmptyExperienceItem,
  formatSkillsText,
  normalizeResume,
  parseSkillsText,
  prepareResumePayload,
} from "../utils/resume.js";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [importText, setImportText] = useState("");
  const [newTemplateId, setNewTemplateId] = useState(resumeTemplates[0].id);

  const publicBaseUrl = useMemo(
    () => (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, ""),
    []
  );
  const shareUrl = activeResume?.slug ? `${publicBaseUrl}/r/${activeResume.slug}` : "";
  const activeTemplate = getTemplateById(activeResume?.templateId);
  const publicResumeCount = resumes.filter((resume) => resume.isPublic).length;
  const lastTouchedLabel = activeResume?.updatedAt
    ? new Date(activeResume.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "New draft";

  const sortResumes = (items) =>
    [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  const upsertResume = (resume, shouldSelect = true) => {
    const normalized = normalizeResume(resume, user);

    setResumes((current) => {
      const exists = current.some((item) => item._id === normalized._id);
      const next = exists
        ? current.map((item) => (item._id === normalized._id ? normalized : item))
        : [normalized, ...current];

      return sortResumes(next);
    });

    if (shouldSelect) {
      setActiveResume(normalized);
      setDirty(false);
    }

    return normalized;
  };

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await api.get("/resumes");
        const normalized = response.data.map((item) => normalizeResume(item, user));
        const sorted = sortResumes(normalized);
        setResumes(sorted);
        setActiveResume(sorted[0] || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load resumes.");
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const updateActiveResume = (updater) => {
    setActiveResume((current) => {
      if (!current) return current;
      return typeof updater === "function" ? updater(current) : { ...current, ...updater };
    });
    setDirty(true);
    setError("");
  };

  const updateContact = (field, value) => {
    updateActiveResume((current) => ({
      ...current,
      contact: {
        ...current.contact,
        [field]: value,
      },
    }));
  };

  const updateExperience = (index, field, value) => {
    updateActiveResume((current) => {
      const next = [...current.experience];
      next[index] = { ...next[index], [field]: value };
      return { ...current, experience: next };
    });
  };

  const persistActiveResume = async (successMessage = "Changes saved.") => {
    if (!activeResume?._id) return null;

    try {
      setSaving(true);
      const response = await api.put(`/resumes/${activeResume._id}`, prepareResumePayload(activeResume));
      const saved = upsertResume(response.data);
      if (successMessage) setNotice(successMessage);
      return saved;
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this resume.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const ensureSavedBeforeAction = async () => {
    if (dirty) {
      await persistActiveResume("");
    }
  };

  const handleCreateResume = async () => {
    try {
      setCreating(true);
      const template = getTemplateById(newTemplateId);
      const response = await api.post("/resumes", {
        title: `${user?.name || "New"} Resume`,
        ownerName: user?.name || "",
        templateId: template.id,
        accentColor: template.accent,
        contact: { email: user?.email || "" },
      });
      upsertResume(response.data);
      setNotice("New resume created. Start editing on the right.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create a resume.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectResume = (resume) => {
    if (activeResume?._id === resume._id) return;
    if (dirty && !window.confirm("You have unsaved changes. Continue without saving them?")) return;
    setActiveResume(normalizeResume(resume, user));
    setDirty(false);
    setNotice("");
    setError("");
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Delete this resume permanently?")) return;

    try {
      await api.delete(`/resumes/${resumeId}`);
      const remaining = resumes.filter((item) => item._id !== resumeId);
      setResumes(remaining);
      if (activeResume?._id === resumeId) {
        setActiveResume(remaining[0] || null);
        setDirty(false);
      }
      setNotice("Resume deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this resume.");
    }
  };

  const handleOptimize = async (mode) => {
    if (!activeResume?._id) return;

    try {
      await ensureSavedBeforeAction();
      setBusyAction(mode);
      const response = await api.post(`/resumes/${activeResume._id}/optimize`, {
        mode,
        jobDescription,
      });
      upsertResume(response.data.resume);
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not optimize this resume.");
    } finally {
      setBusyAction("");
    }
  };

  const handleImportResume = async () => {
    if (!activeResume?._id || !importText.trim()) return;

    try {
      await ensureSavedBeforeAction();
      setBusyAction("import");
      const response = await api.post(`/resumes/${activeResume._id}/import`, {
        resumeText: importText,
      });
      upsertResume(response.data.resume);
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not import resume text.");
    } finally {
      setBusyAction("");
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const canReadAsText = file.type.startsWith("text/") || /\.(txt|md|json)$/i.test(file.name);
    if (!canReadAsText) {
      setError("Import currently supports text-based resume files such as .txt or .md.");
      event.target.value = "";
      return;
    }

    try {
      setImportText(await file.text());
      setNotice(`Loaded ${file.name}. Review the text, then click import.`);
    } catch (err) {
      setError("Could not read that file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateActiveResume((current) => ({
        ...current,
        profileImage: {
          url: typeof reader.result === "string" ? reader.result : "",
          backgroundRemovedUrl: "",
        },
      }));
      setNotice("Profile image loaded locally. Save the resume to persist it.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleBackgroundRemoval = async () => {
    if (!activeResume?._id || !activeResume.profileImage?.url) return;

    try {
      await ensureSavedBeforeAction();
      setBusyAction("image");
      const response = await api.post(`/resumes/${activeResume._id}/profile-image`, {
        imageUrl: activeResume.profileImage.url,
        removeBackground: true,
      });
      upsertResume(response.data.resume);
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not process the image.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Public link copied to your clipboard.");
    } catch (err) {
      setError("Could not copy the share link.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-card brand-card">
          <p className="eyebrow">AI Resume Builder</p>
          <h1>Build, refine, preview, and share resumes from one workspace.</h1>
          <p className="muted">
            Use templates, import an older resume, polish it with Gemini, and publish a live link when you are ready.
          </p>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-section-head">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>{user?.name || "Your"} resumes</h2>
            </div>
            <button className="ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="template-picker">
            {resumeTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`template-pill ${newTemplateId === template.id ? "active" : ""}`}
                onClick={() => setNewTemplateId(template.id)}
              >
                <strong>{template.name}</strong>
                <span>{template.mood}</span>
              </button>
            ))}
          </div>

          <button onClick={handleCreateResume} disabled={creating} className="full-width">
            {creating ? "Creating..." : "Create New Resume"}
          </button>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-section-head">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Resume list</h2>
            </div>
            {loading ? <span className="muted">Loading...</span> : null}
          </div>

          {!loading && !resumes.length ? (
            <p className="muted">Create your first resume to unlock editing, AI optimization, and live preview.</p>
          ) : null}

          <div className="resume-list">
            {resumes.map((resume) => (
              <article
                key={resume._id}
                className={`resume-list-item ${activeResume?._id === resume._id ? "active" : ""}`}
                onClick={() => handleSelectResume(resume)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectResume(resume);
                  }
                }}
              >
                <div>
                  <p className="eyebrow">{getTemplateById(resume.templateId).name}</p>
                  <h3>{resume.title}</h3>
                  <p className="muted small">{resume.summary || resume.headline || "Open to start editing this resume."}</p>
                </div>

                <div className="resume-list-footer">
                  <span className={`status-pill ${resume.isPublic ? "public" : "private"}`}>
                    {resume.isPublic ? "Public" : "Private"}
                  </span>
                  <button
                    type="button"
                    className="ghost danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteResume(resume._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <section className="workspace-overview">
          <div className="workspace-overview-copy">
            <p className="eyebrow">Resume Studio</p>
            <h2>{user?.name ? `${user.name}, shape your next opportunity.` : "Shape your next opportunity."}</h2>
            <p className="muted">
              {activeResume
                ? `You are editing ${activeResume.title}. Keep the preview open while you tune content, polish it with AI, and prepare a live share link.`
                : "Create a fresh draft, choose a visual direction, and turn scattered details into a polished resume from one workspace."}
            </p>

            <div className="workspace-overview-meta">
              <span className={`workspace-status ${dirty ? "dirty" : "saved"}`}>
                {dirty ? "Unsaved changes" : "Workspace synced"}
              </span>
              <span className={`workspace-status ${activeResume?.isPublic ? "live" : ""}`}>
                {activeResume?.isPublic ? "Public link enabled" : "Private draft"}
              </span>
            </div>
          </div>

          <div className="workspace-metrics">
            <article className="metric-card">
              <span>Total resumes</span>
              <strong>{resumes.length}</strong>
              <p>{loading ? "Loading workspace..." : `${Math.max(resumes.length - publicResumeCount, 0)} private drafts`}</p>
            </article>

            <article className="metric-card accent">
              <span>Public links</span>
              <strong>{publicResumeCount}</strong>
              <p>{publicResumeCount ? "Share-ready resumes available" : "Nothing public yet"}</p>
            </article>

            <article className="metric-card">
              <span>Active template</span>
              <strong>{activeTemplate.name}</strong>
              <p>{activeTemplate.mood}</p>
            </article>

            <article className="metric-card">
              <span>Last touch</span>
              <strong>{lastTouchedLabel}</strong>
              <p>{activeResume ? activeResume.title : "Create a resume to start editing"}</p>
            </article>
          </div>
        </section>

        {error ? <div className="alert">{error}</div> : null}
        {notice ? <div className="success-banner">{notice}</div> : null}

        {!activeResume ? (
          <section className="workspace-card empty-workspace">
            <p className="eyebrow">Start Here</p>
            <h2>Create a resume from the left sidebar.</h2>
            <p className="muted">After that, you can edit details, optimize with AI, and publish a share link.</p>
          </section>
        ) : (
          <div className="workspace-grid">
            <section className="workspace-card editor-card">
              <div className="workspace-toolbar">
                <div>
                  <p className="eyebrow">Editor</p>
                  <h2>{activeResume.title}</h2>
                  <p className="muted">
                    {dirty ? "Unsaved changes" : "All changes saved"}
                    {activeResume.updatedAt ? ` | Updated ${new Date(activeResume.updatedAt).toLocaleString()}` : ""}
                  </p>
                </div>

                <div className="toolbar-actions">
                  <button className="ghost" onClick={() => persistActiveResume()} disabled={saving}>
                    {saving ? "Saving..." : "Save Resume"}
                  </button>
                  <button onClick={() => handleOptimize("full")} disabled={busyAction === "full"}>
                    {busyAction === "full" ? "Optimizing..." : "Optimize With AI"}
                  </button>
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Basics</p>
                  <h3>Identity and positioning</h3>
                </div>
                <div className="form-grid two-column">
                  <label>
                    Resume title
                    <input value={activeResume.title} onChange={(event) => updateActiveResume({ title: event.target.value })} />
                  </label>
                  <label>
                    Owner name
                    <input value={activeResume.ownerName} onChange={(event) => updateActiveResume({ ownerName: event.target.value })} />
                  </label>
                  <label className="full-span">
                    Headline
                    <input
                      value={activeResume.headline}
                      onChange={(event) => updateActiveResume({ headline: event.target.value })}
                      placeholder="Full Stack Developer | MERN | AI-enhanced products"
                    />
                  </label>
                  <label className="full-span">
                    Summary
                    <textarea
                      rows="4"
                      value={activeResume.summary}
                      onChange={(event) => updateActiveResume({ summary: event.target.value })}
                      placeholder="Write a concise summary about your strengths, focus, and impact."
                    />
                  </label>
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Contact</p>
                  <h3>Links and essentials</h3>
                </div>
                <div className="form-grid two-column">
                  <label>
                    Email
                    <input value={activeResume.contact.email} onChange={(event) => updateContact("email", event.target.value)} />
                  </label>
                  <label>
                    Phone
                    <input value={activeResume.contact.phone} onChange={(event) => updateContact("phone", event.target.value)} />
                  </label>
                  <label>
                    Location
                    <input value={activeResume.contact.location} onChange={(event) => updateContact("location", event.target.value)} />
                  </label>
                  <label>
                    Website
                    <input value={activeResume.contact.website} onChange={(event) => updateContact("website", event.target.value)} />
                  </label>
                  <label className="full-span">
                    LinkedIn
                    <input value={activeResume.contact.linkedin} onChange={(event) => updateContact("linkedin", event.target.value)} />
                  </label>
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Template</p>
                  <h3>Choose the visual direction</h3>
                </div>
                <div className="template-grid">
                  {resumeTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`template-card ${activeResume.templateId === template.id ? "selected" : ""}`}
                      onClick={() => updateActiveResume({ templateId: template.id, accentColor: template.accent })}
                    >
                      <span className="template-swatch" style={{ background: template.accent }} />
                      <strong>{template.name}</strong>
                      <span>{template.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading split-heading">
                  <div>
                    <p className="eyebrow">Skills</p>
                    <h3>Keywords and stack</h3>
                  </div>
                  <button type="button" className="ghost" onClick={() => handleOptimize("skills")} disabled={busyAction === "skills"}>
                    {busyAction === "skills" ? "Refreshing..." : "Refresh With AI"}
                  </button>
                </div>
                <label>
                  Skills list
                  <textarea
                    rows="3"
                    value={formatSkillsText(activeResume.skills)}
                    onChange={(event) => updateActiveResume({ skills: parseSkillsText(event.target.value) })}
                    placeholder="React, Node.js, MongoDB, Tailwind CSS, Gemini API"
                  />
                </label>
              </div>

              <div className="editor-section">
                <div className="section-heading split-heading">
                  <div>
                    <p className="eyebrow">Experience</p>
                    <h3>Roles and impact</h3>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => updateActiveResume((current) => ({ ...current, experience: [...current.experience, createEmptyExperienceItem()] }))}
                  >
                    Add Role
                  </button>
                </div>
                <div className="stack-section">
                  {activeResume.experience.map((item, index) => (
                    <article key={item.clientKey} className="stack-card">
                      <div className="stack-card-head">
                        <h4>Experience {index + 1}</h4>
                        <button
                          type="button"
                          className="ghost danger"
                          onClick={() =>
                            updateActiveResume((current) => ({
                              ...current,
                              experience:
                                current.experience.length > 1
                                  ? current.experience.filter((_, itemIndex) => itemIndex !== index)
                                  : [createEmptyExperienceItem()],
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="form-grid two-column">
                        <label>
                          Role
                          <input value={item.role} onChange={(event) => updateExperience(index, "role", event.target.value)} />
                        </label>
                        <label>
                          Company
                          <input value={item.company} onChange={(event) => updateExperience(index, "company", event.target.value)} />
                        </label>
                        <label>
                          Start date
                          <input value={item.startDate} onChange={(event) => updateExperience(index, "startDate", event.target.value)} />
                        </label>
                        <label>
                          End date
                          <input value={item.endDate} onChange={(event) => updateExperience(index, "endDate", event.target.value)} />
                        </label>
                        <label className="full-span">
                          Location
                          <input value={item.location} onChange={(event) => updateExperience(index, "location", event.target.value)} />
                        </label>
                        <label className="full-span">
                          Role summary
                          <textarea
                            rows="3"
                            value={item.description}
                            onChange={(event) => updateExperience(index, "description", event.target.value)}
                          />
                        </label>
                        <label className="full-span">
                          Key achievements
                          <textarea
                            rows="4"
                            value={(item.achievements || []).join("\n")}
                            onChange={(event) =>
                              updateExperience(
                                index,
                                "achievements",
                                event.target.value
                                  .split("\n")
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                              )
                            }
                            placeholder={"Built a resume builder used by 1,200 monthly users\nReduced manual editing time by 40%"}
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Import And AI</p>
                  <h3>Bring in an old resume and optimize it</h3>
                </div>
                <div className="form-grid">
                  <label className="full-span">
                    Paste resume text
                    <textarea
                      rows="6"
                      value={importText}
                      onChange={(event) => setImportText(event.target.value)}
                      placeholder="Paste text from your existing resume here, or upload a text-based file below."
                    />
                  </label>
                  <label>
                    Upload text file
                    <input type="file" accept=".txt,.md,.json,text/plain" onChange={handleFileImport} />
                  </label>
                  <label className="full-span">
                    Target job description
                    <textarea
                      rows="5"
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder="Paste the job description to tailor headline, summary, and skills."
                    />
                  </label>
                </div>
                <div className="toolbar-actions">
                  <button type="button" className="ghost" onClick={handleImportResume} disabled={busyAction === "import" || !importText.trim()}>
                    {busyAction === "import" ? "Importing..." : "Import Resume Text"}
                  </button>
                  <button type="button" className="ghost" onClick={() => handleOptimize("summary")} disabled={busyAction === "summary"}>
                    {busyAction === "summary" ? "Polishing..." : "Polish Summary"}
                  </button>
                  <button type="button" className="ghost" onClick={() => handleOptimize("headline")} disabled={busyAction === "headline"}>
                    {busyAction === "headline" ? "Rewriting..." : "Rewrite Headline"}
                  </button>
                </div>
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Profile Image</p>
                  <h3>Upload a headshot and prepare it for templates</h3>
                </div>
                <div className="form-grid two-column">
                  <label>
                    Upload image
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <label>
                    Or paste image URL
                    <input
                      value={activeResume.profileImage.url}
                      onChange={(event) =>
                        updateActiveResume((current) => ({
                          ...current,
                          profileImage: {
                            url: event.target.value,
                            backgroundRemovedUrl: "",
                          },
                        }))
                      }
                      placeholder="https://..."
                    />
                  </label>
                </div>
                {activeResume.profileImage.url ? (
                  <div className="image-row">
                    <img
                      src={activeResume.profileImage.backgroundRemovedUrl || activeResume.profileImage.url}
                      alt="Profile preview"
                      className="image-thumb"
                    />
                    <div className="image-actions">
                      <button type="button" className="ghost" onClick={handleBackgroundRemoval} disabled={busyAction === "image"}>
                        {busyAction === "image" ? "Processing..." : "Remove Background"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="editor-section">
                <div className="section-heading">
                  <p className="eyebrow">Sharing</p>
                  <h3>Publish a live preview link</h3>
                </div>
                <div className="form-grid two-column">
                  <label>
                    Public slug
                    <input value={activeResume.slug} onChange={(event) => updateActiveResume({ slug: event.target.value })} />
                  </label>
                  <label className="toggle-field">
                    <span>Public visibility</span>
                    <button
                      type="button"
                      className={`toggle-button ${activeResume.isPublic ? "on" : ""}`}
                      onClick={() => updateActiveResume({ isPublic: !activeResume.isPublic })}
                    >
                      <span />
                    </button>
                  </label>
                  <label className="full-span">
                    Live link
                    <div className="share-row">
                      <input value={shareUrl} readOnly />
                      <button type="button" className="ghost" onClick={handleCopyShareLink} disabled={!activeResume.isPublic || !shareUrl}>
                        Copy Link
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <aside className="workspace-card preview-card">
              <div className="preview-panel-head">
                <div>
                  <p className="eyebrow">Live Preview</p>
                  <h3>{activeTemplate.name}</h3>
                </div>
                {activeResume.isPublic && shareUrl ? (
                  <a className="ghost preview-link" href={shareUrl} target="_blank" rel="noreferrer">
                    Open Public Link
                  </a>
                ) : (
                  <span className="muted small">Save and keep this resume public to share it.</span>
                )}
              </div>
              <ResumePreview resume={activeResume} />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
