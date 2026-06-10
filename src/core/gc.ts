import { promises as fs } from "fs";
import path from "path";
import { DOCS_BASE_PATH, getMarkdownFiles } from "./utils.js";

/**
 * Context Garbage Collector
 * Monitors context bloat and moves old/irrelevant files to 40_archive.
 */
export async function runContextGC() {
  console.error("[GC] Starting context garbage collection...");
  const projectsPath = path.join(DOCS_BASE_PATH, "10_projects");
  
  try {
    const projects = await fs.readdir(projectsPath);
    for (const project of projects) {
      const projectPath = path.join(projectsPath, project);
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;

      // Logic: If a project README status is 'Completed', move to archive
      const readmePath = path.join(projectPath, "README.md");
      try {
        const readme = await fs.readFile(readmePath, "utf-8");
        if (readme.includes("Status: Completed")) {
          console.error(`[GC] Archiving completed project: ${project}`);
          const now = new Date();
          const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const destDir = path.join(DOCS_BASE_PATH, "40_archive", monthFolder);
          await fs.mkdir(destDir, { recursive: true });
          await fs.rename(projectPath, path.join(destDir, project));
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error(`[GC] Error during GC: ${error}`);
  }
}
