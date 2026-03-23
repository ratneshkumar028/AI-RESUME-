import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import ResumePreview from "../components/ResumePreview.jsx";
import { normalizeResume } from "../utils/resume.js";

const PublicResume = () => {
  const { slug } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/resumes/public/${slug}`);
        setResume(normalizeResume(response.data));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this public resume.");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [slug]);

  return (
    <div className="public-page">
      <header className="public-topbar">
        <div>
          <p className="eyebrow">Live Resume Link</p>
          <h1>{resume?.ownerName || "Public Resume"}</h1>
        </div>
        <Link className="ghost public-link-button" to="/">
          Build your own
        </Link>
      </header>

      {loading ? <div className="card wide-card">Loading public resume...</div> : null}
      {!loading && error ? <div className="card wide-card alert">{error}</div> : null}
      {!loading && resume ? <ResumePreview resume={resume} /> : null}
    </div>
  );
};

export default PublicResume;
