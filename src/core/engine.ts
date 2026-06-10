import { promises as fs } from "fs";
import path from "path";
import { DOCS_BASE_PATH } from "./utils.js";

export async function getOptimizedContext(projectSlug: string) {
  const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
  
  try {
    const readme = await fs.readFile(path.join(projectPath, "README.md"), "utf-8");
    let devPlan = "";
    try {
      devPlan = await fs.readFile(path.join(projectPath, "DEVELOPMENT_PLAN.md"), "utf-8");
    } catch (e) {}

    const systemPolicy = await fs.readFile(path.join(DOCS_BASE_PATH, "20_areas", "documentation-system.md"), "utf-8");

    return `
# Project Context: ${projectSlug}
${readme}

## Development Plan
${devPlan || "No development plan found."}

## System Documentation Policy
${systemPolicy}
    `.trim();
  } catch (error) {
    throw new Error(`Error fetching context for ${projectSlug}: ${error}`);
  }
}

export async function archiveProject(projectSlug: string) {
  const srcPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
  const now = new Date();
  const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const destDir = path.join(DOCS_BASE_PATH, "40_archive", monthFolder);
  const destPath = path.join(destDir, projectSlug);

  try {
    await fs.mkdir(destDir, { recursive: true });
    await fs.rename(srcPath, destPath);
    return `Successfully archived ${projectSlug} to ${monthFolder}`;
  } catch (error) {
    throw new Error(`Error archiving ${projectSlug}: ${error}`);
  }
}

export async function extractSpecFromCode(filePath: string, projectSlug?: string) {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  try {
    const content = await fs.readFile(fullPath, "utf-8");
    const lines = content.split("\n");
    const specLines = lines.filter((l: string) => 
      l.trim().startsWith("export") || 
      l.trim().startsWith("class") || 
      l.trim().startsWith("function") ||
      l.trim().startsWith("interface") ||
      l.trim().startsWith("/**")
    );

    const specSummary = `
# Extracted Spec from: ${filePath}
Generated on: ${new Date().toISOString()}

\`\`\`typescript
${specLines.join("\n")}
\`\`\`
    `.trim();

    if (projectSlug) {
      const specFilePath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug, "SPEC.md");
      await fs.appendFile(specFilePath, `\n\n${specSummary}\n`, "utf-8");
    }

    return specSummary;
  } catch (error) {
    throw new Error(`Error extracting spec from ${filePath}: ${error}`);
  }
}
