import { promises as fs } from "fs";
import path from "path";
import { DOCS_BASE_PATH, getMarkdownFiles } from "../core/utils.js";

export async function listProjects(filterStatus: string = "All") {
  const projectsPath = path.join(DOCS_BASE_PATH, "10_projects");
  const dirs = await fs.readdir(projectsPath);
  const projects = [];

  for (const dir of dirs) {
    const projectDir = path.join(projectsPath, dir);
    const stat = await fs.stat(projectDir).catch(() => null);
    if (!stat || !stat.isDirectory()) continue;

    const readmePath = path.join(projectDir, "README.md");
    try {
      const readme = await fs.readFile(readmePath, "utf-8");
      const titleMatch = readme.match(/^#\s+(.+)$/m);
      const statusMatch = readme.match(/^Status:\s*(.+)$/mi);
      const assigneeMatch = readme.match(/^Assignee:\s*(.+)$/mi);

      const title = titleMatch ? titleMatch[1].trim() : dir;
      const projectStatus = statusMatch ? statusMatch[1].trim() : "Unknown";
      const assignee = assigneeMatch ? assigneeMatch[1].trim() : "@unassigned";

      const tasksMatch = readme.match(/- \[[ xX]\]/g) || [];
      const completedTasksMatch = readme.match(/- \[[xX]\]/g) || [];

      projects.push({
        slug: dir,
        title,
        status: projectStatus,
        assignee,
        totalTasks: tasksMatch.length,
        completedTasks: completedTasksMatch.length
      });
    } catch (e) {
      projects.push({
        slug: dir,
        title: dir,
        status: "No README",
        assignee: "@unassigned",
        totalTasks: 0,
        completedTasks: 0
      });
    }
  }

  const filtered = projects.filter(p => {
    if (filterStatus === "All") return true;
    return p.status.toLowerCase() === filterStatus.toLowerCase();
  });

  let markdown = `### PARA Projects Status Board (${filterStatus})\n\n`;
  markdown += `| Project Slug | Title | Status | Assignee | Deliverables |\n`;
  markdown += `| --- | --- | --- | --- | --- |\n`;

  for (const p of filtered) {
    const progress = p.totalTasks > 0
      ? `${p.completedTasks}/${p.totalTasks} (${Math.round((p.completedTasks * 100) / p.totalTasks)}%)`
      : "No tasks";
    markdown += `| \`${p.slug}\` | **${p.title}** | \`${p.status}\` | ${p.assignee} | ${progress} |\n`;
  }

  return markdown;
}

export async function validateParaIntegrity() {
  const issues: { type: "error" | "warning" | "info"; message: string }[] = [];
  let projectsCount = 0;
  let cleanProjects = 0;

  const projectsPath = path.join(DOCS_BASE_PATH, "10_projects");
  try {
    const projectDirs = await fs.readdir(projectsPath);
    for (const dir of projectDirs) {
      const projectPath = path.join(projectsPath, dir);
      const stat = await fs.stat(projectPath).catch(() => null);
      if (!stat || !stat.isDirectory()) continue;
      projectsCount++;

      let hasReadme = false;
      let hasDevPlan = false;

      try {
        await fs.access(path.join(projectPath, "README.md"));
        hasReadme = true;
      } catch (e) {}

      try {
        await fs.access(path.join(projectPath, "DEVELOPMENT_PLAN.md"));
        hasDevPlan = true;
      } catch (e) {}

      if (!hasReadme) {
        issues.push({
          type: "error",
          message: `Project \`${dir}\` is missing its \`README.md\`.`
        });
      }

      if (!hasDevPlan) {
        issues.push({
          type: "warning",
          message: `Project \`${dir}\` is missing its \`DEVELOPMENT_PLAN.md\`.`
        });
      }

      if (hasReadme && hasDevPlan) cleanProjects++;
    }
  } catch (e) {}

  let report = `## PARA System Integrity Report\n\n`;
  if (issues.length === 0) {
    report += `✅ PARA structure is compliant.\n\n- Total Active Projects: ${projectsCount}\n`;
  } else {
    report += `⚠️ Found ${issues.length} compliance recommendation(s):\n\n`;
    for (const issue of issues) {
      const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";
      report += `- ${icon} [${issue.type.toUpperCase()}] ${issue.message}\n`;
    }
  }
  return report;
}

export async function searchParaDocs(query: string) {
  const searchFolders = ["10_projects", "20_areas", "30_resources", "40_archive"];
  let allFiles: string[] = [];

  for (const folder of searchFolders) {
    const folderPath = path.join(DOCS_BASE_PATH, folder);
    allFiles = allFiles.concat(await getMarkdownFiles(folderPath));
  }

  const results = [];
  for (const file of allFiles) {
    try {
      const content = await fs.readFile(file, "utf-8");
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const lines = content.split("\n");
        const matchedLines: { lineNum: number; content: string }[] = [];
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            matchedLines.push({ lineNum: index + 1, content: line.trim() });
          }
        });

        results.push({
          file: path.relative(DOCS_BASE_PATH, file),
          fullPath: file,
          matches: matchedLines.slice(0, 3)
        });
      }
    } catch (e) {}
  }

  let searchReport = `## Search Results for "${query}"\n\n`;
  if (results.length === 0) {
    searchReport += `No matches found.`;
  } else {
    searchReport += `Found matches in ${results.length} files:\n\n`;
    for (const r of results) {
      searchReport += `### 📁 [${r.file}](file://${r.fullPath})\n`;
      for (const m of r.matches) {
        searchReport += `- **Line ${m.lineNum}**: \`${m.content}\`\n`;
      }
      searchReport += `\n`;
    }
  }
  return searchReport;
}
