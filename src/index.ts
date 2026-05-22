#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
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
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Themis MCP server running on stdio");
  }
}

const server = new ThemisServer();
server.run().catch(console.error);
