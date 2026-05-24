import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Base path for PARA docs (assuming execution from project root)
const DOCS_BASE_PATH = path.resolve(process.cwd(), "docs/_para");

/**
 * Themis Cognitive OS Harness MCP Server
 */
class ThemisServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "themis-cognitive-harness",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
  }

  private setupHandlers() {
    // List available resources (PARA docs)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: any[] = [];
      
      try {
        const paraFolders = ["10_projects", "20_areas", "30_resources"];
        for (const folder of paraFolders) {
          const folderPath = path.join(DOCS_BASE_PATH, folder);
          try {
            const files = await fs.readdir(folderPath, { recursive: true });
            for (const file of files) {
              const filePath = path.join(folderPath, file.toString());
              const stat = await fs.stat(filePath);
              if (stat.isFile() && file.toString().endsWith(".md")) {
                resources.push({
                  uri: `themis://docs/${folder}/${file}`,
                  name: `${folder}/${file}`,
                  mimeType: "text/markdown",
                  description: `PARA Document: ${file}`
                });
              }
            }
          } catch (e) {
            // Folder might not exist yet
          }
        }
      } catch (error) {
        console.error("Error listing resources:", error);
      }

      return { resources };
    });

    // Read specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = new URL(request.params.uri);
      if (uri.protocol !== "themis:") {
        throw new Error(`Invalid protocol: ${uri.protocol}`);
      }

      const docPath = uri.pathname.replace(/^\/docs\//, "");
      const fullPath = path.join(DOCS_BASE_PATH, docPath);

      try {
        const content = await fs.readFile(fullPath, "utf-8");
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/markdown",
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_optimized_context",
          description: "Get optimized context from PARA docs to reduce token usage.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "The slug of the current project" }
            },
            required: ["project_slug"]
          }
        },
        {
          name: "extract_spec_from_code",
          description: "Analyze code and extract precise specs back to documentation.",
          inputSchema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "Path to the source file to analyze" },
              project_slug: { type: "string", description: "Optional: Project slug to save the spec into its folder" }
            },
            required: ["file_path"]
          }
        },
        {
          name: "archive_project",
          description: "Archive a completed project following PARA rules.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "The slug of the project to archive" }
            },
            required: ["project_slug"]
          }
        },
        {
          name: "create_project",
          description: "Initialize a new active PARA project from templates.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "Folder slug of the new project (e.g. 'my-cool-feature')" },
              title: { type: "string", description: "Human-readable title of the project" },
              description: { type: "string", description: "Brief description of the project goal" },
              assignee: { type: "string", description: "Username of the assignee (e.g. '@username')" },
              tasks: {
                type: "array",
                items: { type: "string" },
                description: "Optional list of initial tasks to include in key deliverables"
              }
            },
            required: ["project_slug", "title", "description", "assignee"]
          }
        },
        {
          name: "close_project",
          description: "Mark an active project as Completed and generate a CHANGE_SUMMARY.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "The slug of the project to close" },
              summary: { type: "string", description: "Summary of changes made during the project" },
              impact_analysis: { type: "string", description: "Description of the impact and affected modules" },
              lessons_learned: { type: "string", description: "Lessons learned or standard rules to be extracted" }
            },
            required: ["project_slug", "summary", "impact_analysis"]
          }
        },
        {
          name: "list_projects",
          description: "List active, planned, and completed PARA projects with their status and task counts.",
          inputSchema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["Active", "Planning", "Completed", "All"],
                description: "Filter projects by status (defaults to All)"
              }
            }
          }
        },
        {
          name: "validate_para_integrity",
          description: "Run a system health check to ensure PARA folder guidelines are strictly followed.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "search_para_docs",
          description: "Perform keyword searching across all PARA documents (Projects, Areas, Resources).",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query/keyword" }
            },
            required: ["query"]
          }
        },
        {
          name: "create_agent_handoff",
          description: "Create or update an AGENT_HANDOFF.md file for a PARA project to collaborate with other agents.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "Folder slug of the target project" },
              sender_agent: { type: "string", description: "Name of the sending agent (e.g. '@copilot')" },
              recipient_agent: { type: "string", description: "Optional name of the target agent (defaults to '@any-agent')" },
              status: {
                type: "string",
                enum: ["completed", "in_progress", "blocked", "needs_review"],
                description: "Current status of the project handoff"
              },
              summary: { type: "string", description: "Summary of changes/work completed by the sender agent" },
              next_steps: {
                type: "array",
                items: { type: "string" },
                description: "List of actionable steps for the next agent to proceed"
              },
              blocking_issues: { type: "string", description: "Optional details on any blockers if status is 'blocked'" }
            },
            required: ["project_slug", "sender_agent", "status", "summary", "next_steps"]
          }
        },
        {
          name: "get_agent_handoff",
          description: "Retrieve and parse the AGENT_HANDOFF.md file of a PARA project to understand previous agent progress.",
          inputSchema: {
            type: "object",
            properties: {
              project_slug: { type: "string", description: "Folder slug of the target project" }
            },
            required: ["project_slug"]
          }
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "get_optimized_context": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
          
          try {
            const readme = await fs.readFile(path.join(projectPath, "README.md"), "utf-8");
            let devPlan = "";
            try {
              devPlan = await fs.readFile(path.join(projectPath, "DEVELOPMENT_PLAN.md"), "utf-8");
            } catch (e) {}

            const systemPolicy = await fs.readFile(path.join(DOCS_BASE_PATH, "20_areas", "documentation-system.md"), "utf-8");

            const combinedContext = `
# Project Context: ${projectSlug}
${readme}

## Development Plan
${devPlan || "No development plan found."}

## System Documentation Policy
${systemPolicy}
            `.trim();

            return {
              content: [{ type: "text", text: combinedContext }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error fetching context for ${projectSlug}: ${error}` }]
            };
          }
        }
        case "archive_project": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const srcPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
          const now = new Date();
          const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const destDir = path.join(DOCS_BASE_PATH, "40_archive", monthFolder);
          const destPath = path.join(destDir, projectSlug);

          try {
            await fs.mkdir(destDir, { recursive: true });
            await fs.rename(srcPath, destPath);
            return {
              content: [{ type: "text", text: `Successfully archived ${projectSlug} to ${monthFolder}` }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error archiving ${projectSlug}: ${error}` }]
            };
          }
        }
        case "extract_spec_from_code": {
          const filePath = request.params.arguments?.file_path as string;
          const projectSlug = request.params.arguments?.project_slug as string | undefined;
          const fullPath = path.resolve(process.cwd(), filePath);
          
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            // Simple logic to extract top-level structure as "spec"
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

            return {
              content: [{ type: "text", text: specSummary }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error extracting spec from ${filePath}: ${error}` }]
            };
          }
        }
        case "create_project": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const title = request.params.arguments?.title as string;
          const description = request.params.arguments?.description as string;
          const assignee = request.params.arguments?.assignee as string;
          const tasks = request.params.arguments?.tasks as string[] | undefined;

          const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);

          try {
            // Check if folder already exists
            try {
              await fs.access(projectPath);
              return {
                isError: true,
                content: [{ type: "text", text: `Project folder '${projectSlug}' already exists.` }]
              };
            } catch (e) {}

            const readmeTemplatePath = path.join(DOCS_BASE_PATH, "20_areas", "templates", "README_TEMPLATE.md");
            const devPlanTemplatePath = path.join(DOCS_BASE_PATH, "20_areas", "templates", "DEVELOPMENT_PLAN_TEMPLATE.md");

            let readmeTemplate = "";
            let devPlanTemplate = "";

            try {
              readmeTemplate = await fs.readFile(readmeTemplatePath, "utf-8");
            } catch (e) {
              readmeTemplate = `# Project Title\nStatus: Active\nAssignee: @username\n\n## Overview\nBrief description.\n\n## Key Deliverables\n- [ ] Task 1\n- [ ] Task 2\n`;
            }

            try {
              devPlanTemplate = await fs.readFile(devPlanTemplatePath, "utf-8");
            } catch (e) {
              devPlanTemplate = `# Development Plan: [Project Name]\n\n## 1. Technical Strategy\n`;
            }

            let readmeContent = readmeTemplate
              .replace("# Project Title", `# ${title}`)
              .replace("Status: [Active / Planning / Completed]", "Status: Active")
              .replace("Assignee: @username", `Assignee: ${assignee.startsWith("@") ? assignee : "@" + assignee}`)
              .replace("Brief description of the project goal.", description);

            if (tasks && tasks.length > 0) {
              const formattedTasks = tasks.map(t => `- [ ] ${t}`).join("\n");
              readmeContent = readmeContent.replace(
                /- \[ \] Task 1\r?\n\s*- \[ \] Task 2/g,
                formattedTasks
              );
            }

            const devPlanContent = devPlanTemplate.replace(/\[Project Name\]/g, title);

            await fs.mkdir(projectPath, { recursive: true });
            await fs.writeFile(path.join(projectPath, "README.md"), readmeContent, "utf-8");
            await fs.writeFile(path.join(projectPath, "DEVELOPMENT_PLAN.md"), devPlanContent, "utf-8");

            return {
              content: [{
                type: "text",
                text: `Successfully initialized project '${projectSlug}' under 10_projects.\n\nCreated:\n- README.md\n- DEVELOPMENT_PLAN.md`
              }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error initializing project ${projectSlug}: ${error}` }]
            };
          }
        }
        case "close_project": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const summary = request.params.arguments?.summary as string;
          const impactAnalysis = request.params.arguments?.impact_analysis as string;
          const lessonsLearned = request.params.arguments?.lessons_learned as string | undefined;

          const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
          const readmePath = path.join(projectPath, "README.md");

          try {
            // Check if project exists
            try {
              await fs.access(projectPath);
            } catch (e) {
              return {
                isError: true,
                content: [{ type: "text", text: `Project folder '${projectSlug}' does not exist.` }]
              };
            }

            // Update README.md status
            let readme = "";
            let title = projectSlug;
            try {
              readme = await fs.readFile(readmePath, "utf-8");
              const titleMatch = readme.match(/^#\s+(.+)$/m);
              if (titleMatch) {
                title = titleMatch[1].trim();
              }
              // Replace Status line
              readme = readme.replace(/^Status:\s*.*$/mi, "Status: Completed");
              await fs.writeFile(readmePath, readme, "utf-8");
            } catch (e) {
              // Readme might not exist or failed to update, proceed
            }

            const changeSummaryTemplatePath = path.join(DOCS_BASE_PATH, "20_areas", "templates", "CHANGE_SUMMARY_TEMPLATE.md");
            let template = "";
            try {
              template = await fs.readFile(changeSummaryTemplatePath, "utf-8");
            } catch (e) {
              template = `# Change Summary: [Project Name]\nCompletion Date: YYYY-MM-DD\n\n## 1. Summary of Changes\n- Feature A implemented.\n- Bug B fixed.\n\n## 2. Impact Analysis\n- Affected modules:\n\n## 3. Lessons Learned / Knowledge Extraction\n- [New Rule]: To be added to \`20_areas/\`\n`;
            }

            const today = new Date().toISOString().split("T")[0];
            const formattedSummary = summary
              .split("\n")
              .map(s => s.trim().startsWith("-") ? s.trim() : `- ${s.trim()}`)
              .join("\n");

            const formattedImpact = impactAnalysis
              .split("\n")
              .map(s => s.trim().startsWith("-") ? s.trim() : `- ${s.trim()}`)
              .join("\n");

            const formattedLessons = lessonsLearned
              ? lessonsLearned.split("\n").map(s => s.trim().startsWith("-") ? s.trim() : `- ${s.trim()}`).join("\n")
              : "- No new rules or knowledge extracted.";

            let changeSummaryContent = template
              .replace(/\[Project Name\]/g, title)
              .replace(/YYYY-MM-DD/g, today)
              .replace(/- Feature A implemented\.\r?\n\s*- Bug B fixed\./g, formattedSummary)
              .replace(/- Affected modules:/g, `- Affected modules:\n${formattedImpact}`)
              .replace(/- \[New Rule\]: To be added to `20_areas\/`/g, formattedLessons);

            await fs.writeFile(path.join(projectPath, "CHANGE_SUMMARY.md"), changeSummaryContent, "utf-8");

            return {
              content: [{
                type: "text",
                text: `Successfully closed project '${projectSlug}'. Updated status to Completed in README.md and generated CHANGE_SUMMARY.md.`
              }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error closing project ${projectSlug}: ${error}` }]
            };
          }
        }
        case "list_projects": {
          const filterStatus = request.params.arguments?.status as string || "All";
          const projectsPath = path.join(DOCS_BASE_PATH, "10_projects");

          try {
            const dirs = await fs.readdir(projectsPath);
            const projects = [];

            for (const dir of dirs) {
              const projectDir = path.join(projectsPath, dir);
              const stat = await fs.stat(projectDir);
              if (!stat.isDirectory()) continue;

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
                // If no README, still include with basic info
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

            return {
              content: [{ type: "text", text: markdown }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error listing projects: ${error}` }]
            };
          }
        }
        case "validate_para_integrity": {
          const issues: { type: "error" | "warning" | "info"; message: string }[] = [];
          let projectsCount = 0;
          let cleanProjects = 0;

          try {
            // 1. Validate active projects
            const projectsPath = path.join(DOCS_BASE_PATH, "10_projects");
            try {
              const projectDirs = await fs.readdir(projectsPath);
              for (const dir of projectDirs) {
                const projectPath = path.join(projectsPath, dir);
                const stat = await fs.stat(projectPath);
                if (!stat.isDirectory()) continue;
                projectsCount++;

                let hasReadme = false;
                let hasDevPlan = false;
                let hasHandoff = false;

                try {
                  await fs.access(path.join(projectPath, "README.md"));
                  hasReadme = true;
                } catch (e) {}

                try {
                  await fs.access(path.join(projectPath, "DEVELOPMENT_PLAN.md"));
                  hasDevPlan = true;
                } catch (e) {}

                try {
                  await fs.access(path.join(projectPath, "AGENT_HANDOFF.md"));
                  hasHandoff = true;
                } catch (e) {}

                if (!hasReadme) {
                  issues.push({
                    type: "error",
                    message: `Project \`${dir}\` is missing its \`README.md\` (required under PARA workflow).`
                  });
                }

                if (!hasDevPlan) {
                  issues.push({
                    type: "warning",
                    message: `Project \`${dir}\` is missing its \`DEVELOPMENT_PLAN.md\`.`
                  });
                }

                if (!hasHandoff) {
                  issues.push({
                    type: "info",
                    message: `Project \`${dir}\` has no \`AGENT_HANDOFF.md\`. Consider creating one if collaborating with other agents.`
                  });
                }

                if (hasReadme && hasDevPlan) {
                  cleanProjects++;
                }
              }
            } catch (e) {
              issues.push({ type: "error", message: `Unable to read \`10_projects\` folder: ${e}` });
            }

            // 2. Check 00_inbox
            try {
              const inboxPath = path.join(DOCS_BASE_PATH, "00_inbox");
              const inboxFiles = await fs.readdir(inboxPath);
              if (inboxFiles.length > 0) {
                issues.push({
                  type: "info",
                  message: `There are ${inboxFiles.length} unsorted files in \`00_inbox/\`. Please organize them into Projects, Areas, or Resources.`
                });
              }
            } catch (e) {
              // 00_inbox might not exist yet
            }

            // 3. Check docs/ root (outside _para)
            try {
              const docsRootPath = path.resolve(DOCS_BASE_PATH, "..");
              const docsRootContents = await fs.readdir(docsRootPath);
              const legacyFolders = ["design-samples", "methodology", "plans", "pptx", "regulatory", "strategic_review"];

              for (const item of docsRootContents) {
                if (item === "_para" || item === "expert_specs" || item === "patent_working" || item.startsWith(".")) {
                  continue;
                }
                const fullItemPath = path.join(docsRootPath, item);
                const stat = await fs.stat(fullItemPath);
                if (stat.isDirectory() && legacyFolders.includes(item)) {
                  issues.push({
                    type: "warning",
                    message: `Legacy folder \`docs/${item}\` found outside PARA structure. Consider migrating it to \`_para/30_resources/\` or \`_para/40_archive/\`.`
                  });
                } else if (stat.isFile() && item.endsWith(".pdf")) {
                  issues.push({
                    type: "warning",
                    message: `PDF file \`docs/${item}\` found in root. Consider moving it to \`_para/30_resources/\`.`
                  });
                }
              }
            } catch (e) {}

            // Construct report
            let report = `## PARA System Integrity Report\n\n`;
            if (issues.length === 0) {
              report += `✅ **Excellent!** PARA directory structure is perfectly clean and compliant.\n\n`;
              report += `- Total Active Projects: ${projectsCount}\n`;
            } else {
              report += `⚠️ **Found ${issues.length} compliance recommendation(s):**\n\n`;
              for (const issue of issues) {
                const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";
                report += `- ${icon} [${issue.type.toUpperCase()}] ${issue.message}\n`;
              }
              report += `\n### Statistics:\n`;
              report += `- Compliant Projects: ${cleanProjects} / ${projectsCount}\n`;
            }

            return {
              content: [{ type: "text", text: report }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error running integrity check: ${error}` }]
            };
          }
        }
        case "search_para_docs": {
          const query = request.params.arguments?.query as string;
          const searchFolders = ["10_projects", "20_areas", "30_resources", "40_archive"];
          let allFiles: string[] = [];

          try {
            for (const folder of searchFolders) {
              const folderPath = path.join(DOCS_BASE_PATH, folder);
              allFiles = allFiles.concat(await this.getMarkdownFiles(folderPath));
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

                  const relPath = path.relative(DOCS_BASE_PATH, file);
                  results.push({
                    file: relPath,
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

            return {
              content: [{ type: "text", text: searchReport }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error running search: ${error}` }]
            };
          }
        }
        case "create_agent_handoff": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const senderAgent = request.params.arguments?.sender_agent as string;
          const recipientAgent = (request.params.arguments?.recipient_agent as string) || "@any-agent";
          const status = request.params.arguments?.status as string;
          const summary = request.params.arguments?.summary as string;
          const nextSteps = request.params.arguments?.next_steps as string[];
          const blockingIssues = (request.params.arguments?.blocking_issues as string) || "";

          const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);

          try {
            // Check if project exists
            try {
              await fs.access(projectPath);
            } catch (e) {
              return {
                isError: true,
                content: [{ type: "text", text: `Project folder '${projectSlug}' does not exist.` }]
              };
            }

            const handoffTemplatePath = path.join(DOCS_BASE_PATH, "20_areas", "templates", "AGENT_HANDOFF_TEMPLATE.md");
            let template = "";
            try {
              template = await fs.readFile(handoffTemplatePath, "utf-8");
            } catch (e) {
              template = `# Agent Handoff: [Project Name]\n- **Date**: YYYY-MM-DD\n- **Sender Agent**: [Sender]\n- **Recipient Agent**: [Recipient]\n- **Status**: [Status]\n\n## 1. Summary of Progress\n- [Summary]\n\n## 2. Next Action Steps for Collaborative Agent\n- [ ] Step 1\n- [ ] Step 2\n\n## 3. Blocking Issues (If Applicable)\n- [Blocking Issues]\n`;
            }

            let title = projectSlug;
            try {
              const readme = await fs.readFile(path.join(projectPath, "README.md"), "utf-8");
              const titleMatch = readme.match(/^#\s+(.+)$/m);
              if (titleMatch) {
                title = titleMatch[1].trim();
              }
            } catch (e) {}

            const today = new Date().toISOString().split("T")[0];
            const formattedSummary = summary
              .split("\n")
              .map(s => s.trim().startsWith("-") ? s.trim() : `- ${s.trim()}`)
              .join("\n");
            
            const formattedSteps = nextSteps.map(step => `- [ ] ${step.trim()}`).join("\n");
            const formattedBlocking = status === "blocked" && blockingIssues
              ? blockingIssues.split("\n").map(s => s.trim().startsWith("-") ? s.trim() : `- ${s.trim()}`).join("\n")
              : "- None";

            const handoffContent = template
              .replace("[Project Name]", title)
              .replace("YYYY-MM-DD", today)
              .replace("[Sender]", senderAgent)
              .replace("[Recipient]", recipientAgent)
              .replace("[Status]", status)
              .replace("- [Summary]", formattedSummary)
              .replace(/- \[ \] Step 1\r?\n\s*- \[ \] Step 2/g, formattedSteps)
              .replace("- [Blocking Issues]", formattedBlocking);

            await fs.writeFile(path.join(projectPath, "AGENT_HANDOFF.md"), handoffContent, "utf-8");

            return {
              content: [{
                type: "text",
                text: `Successfully created/updated AGENT_HANDOFF.md for project '${projectSlug}'.\n\nStatus: ${status}\nSender: ${senderAgent}\nRecipient: ${recipientAgent}`
              }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error creating agent handoff for ${projectSlug}: ${error}` }]
            };
          }
        }
        case "get_agent_handoff": {
          const projectSlug = request.params.arguments?.project_slug as string;
          const projectPath = path.join(DOCS_BASE_PATH, "10_projects", projectSlug);
          const handoffPath = path.join(projectPath, "AGENT_HANDOFF.md");

          try {
            const content = await fs.readFile(handoffPath, "utf-8");

            const senderMatch = content.match(/Sender Agent\*\*:\s*(.+)$/m);
            const recipientMatch = content.match(/Recipient Agent\*\*:\s*(.+)$/m);
            const statusMatch = content.match(/Status\*\*:\s*(.+)$/m);
            const dateMatch = content.match(/Date\*\*:\s*(.+)$/m);

            const sender = senderMatch ? senderMatch[1].trim() : "Unknown";
            const recipient = recipientMatch ? recipientMatch[1].trim() : "@any-agent";
            const status = statusMatch ? statusMatch[1].trim() : "Unknown";
            const date = dateMatch ? dateMatch[1].trim() : "Unknown";

            const nextSteps: string[] = [];
            const lines = content.split("\n");
            let inNextStepsSection = false;
            let inSummarySection = false;
            let inBlockingSection = false;

            const summaryLines: string[] = [];
            const blockingLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("## 1. Summary of Progress")) {
                inSummarySection = true;
                inNextStepsSection = false;
                inBlockingSection = false;
                continue;
              }
              if (line.startsWith("## 2. Next Action Steps")) {
                inSummarySection = false;
                inNextStepsSection = true;
                inBlockingSection = false;
                continue;
              }
              if (line.startsWith("## 3. Blocking Issues")) {
                inSummarySection = false;
                inNextStepsSection = false;
                inBlockingSection = true;
                continue;
              }

              if (inSummarySection && line.trim()) {
                summaryLines.push(line.trim());
              }
              if (inNextStepsSection && line.trim()) {
                const match = line.match(/^-\s*\[\s*[ xX]?\s*\]\s*(.+)$/);
                if (match) {
                  nextSteps.push(match[1].trim());
                } else if (line.trim().startsWith("-")) {
                  nextSteps.push(line.trim().substring(1).trim());
                }
              }
              if (inBlockingSection && line.trim()) {
                blockingLines.push(line.trim());
              }
            }

            const structuredData = {
              project_slug: projectSlug,
              date,
              sender_agent: sender,
              recipient_agent: recipient,
              status,
              summary: summaryLines.join("\n"),
              next_steps: nextSteps,
              blocking_issues: blockingLines.join("\n")
            };

            const markdownResponse = `
### 🤖 Agent Handoff Context: \`${projectSlug}\`
- **Handoff Date**: ${date}
- **Sender Agent**: \`${sender}\`
- **Recipient Agent**: \`${recipient}\`
- **Status**: \`${status}\`

#### 📝 Summary of Progress
${summaryLines.join("\n") || "No summary provided."}

#### 🎯 Next Action Steps for Receiving Agent
${nextSteps.map(step => `- [ ] ${step}`).join("\n") || "No next steps provided."}

${status.toLowerCase() === "blocked" ? `#### ⚠️ Blocking Issues\n${blockingLines.join("\n")}` : ""}

---
#### ⚙️ Structured Agent Metadata (JSON-parseable)
\`\`\`json
${JSON.stringify(structuredData, null, 2)}
\`\`\`
            `.trim();

            return {
              content: [{ type: "text", text: markdownResponse }]
            };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `No AGENT_HANDOFF.md found for project '${projectSlug}'. Make sure the project exists and a handoff has been created.` }]
            };
          }
        }
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    let files: string[] = [];
    try {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(await this.getMarkdownFiles(fullPath));
        } else if (stat.isFile() && item.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (e) {}
    return files;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Themis MCP server running on stdio");
  }

  async connect(transport: any) {
    await this.server.connect(transport);
  }

  async close() {
    await this.server.close();
  }
}

// Global SIGINT handler
process.on('SIGINT', () => {
  console.error("SIGINT received, shutting down...");
  process.exit(0);
});

// Run Dual-Transport Boot Logic
const args = process.argv.slice(2);
const isSSMode = args.includes("--sse") || process.env.THEMIS_TRANSPORT === "sse" || !!process.env.PORT;

if (isSSMode) {
  const app = express();
  app.use(express.json());

  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req: any, res: any) => {
    console.error("New SSE connection requested");
    const transport = new SSEServerTransport("/messages", res);
    
    // Set headers to keep connection alive and allow CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    transports.set(transport.sessionId, transport);
    console.error(`Session initialized: ${transport.sessionId}`);

    // Create a new independent Themis Server instance for this connection
    const sessionServer = new ThemisServer();
    await sessionServer.connect(transport);

    req.on("close", async () => {
      console.error(`Session closed: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
      await sessionServer.close();
    });
  });

  app.post("/messages", async (req: any, res: any) => {
    const sessionId = req.query.sessionId as string;
    console.error(`POST message received for session: ${sessionId}`);
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(404).send(`Transport not found for session ID: ${sessionId}`);
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`Themis MCP server running on SSE at http://localhost:${PORT}`);
  });
} else {
  // Local Stdio Mode
  const server = new ThemisServer();
  server.run().catch(console.error);
}

