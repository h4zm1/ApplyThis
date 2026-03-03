import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResume } from "../services/resumeService";
import type { Resume } from "../types/resume";
import LateXEditor from "../components/LaTeXEditor";

const Editor = () => {
  const { resumeId } = useParams(); // get resume id from url
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState("");

  useEffect(() => {
    loadResume();
  }, [resumeId]);

  async function loadResume() {
    try {
      const data = await getResume(resumeId!);
      setResume(data);

      // set source from feteched data
      // fallback to template if feteched source is empty
      setSource(data.source || getDefaultTamplate());
    } catch (error) {
      setError("failed to load resume");
    } finally {
      setIsLoading(false);
    }
  }
  if (isLoading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }
  return (
    <div>
      <LateXEditor value={source} onChange={setSource} />
    </div>
  );
};
// return basic latex template for new resumes
function getDefaultTamplate(): string {
  return `\\documentclass{article}

    \\begin{document}

    \\section* {NAME}
    Contact info.

    \\section* {Experience}
    Experience here.

    \\section* {Education}
    Education here.

\\end{document}
    `;
}
export default Editor;
