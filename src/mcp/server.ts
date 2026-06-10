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
import express from "express";
import { DOCS_BASE_PATH } from "../core/utils.js";
import * as engine from "../core/engine.js";
import * as para from "../para/manager.js";

export class ThemisServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "themis-cognitive-harness",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    this.server.onerror = (error) => console.error("[MCP Error]", error);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: any[] = [];
      const paraFolders = ["10_projects", "20_areas", "30_resources"];
      for (const folder of paraFolders) {
        const folderPath = path.join(DOCS_BASE_PATH, folder);
        try {
          const files = await fs.readdir(folderPath, { recursive: true });
          for (const file of files) {
            const stat = await fs.stat(path.join(folderPath, file.toString()));
            if (stat.isFile() && file.toString().endsWith(".md")) {
              resources.push({
                uri: `themis://docs/${folder}/${file}`,
                name: `${folder}/${file}`,
                mimeType: "text/markdown",
              });
            }
          }
        } catch (e) {}
      }
      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = new URL(request.params.uri);
      const docPath = uri.pathname.replace(/^\/docs\//, "");
      const fullPath = path.join(DOCS_BASE_PATH, docPath);
      const content = await fs.readFile(fullPath, "utf-8");
      return {
        contents: [{ uri: request.params.uri, mimeType: "text/markdown", text: content }],
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_optimized_context",
          description: "Get optimized PARA context.",
          inputSchema: {
            type: "object",
            properties: { project_slug: { type: "string" } },
            required: ["project_slug"]
          }
        },
        {
          name: "list_projects",
          description: "List PARA projects.",
          inputSchema: {
            type: "object",
            properties: { status: { type: "string", enum: ["Active", "Planning", "Completed", "All"] } }
          }
        },
        {
          name: "validate_para_integrity",
          description: "Run PARA health check.",
          inputSchema: { type: "object", properties: {} }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "get_optimized_context":
            return { content: [{ type: "text", text: await engine.getOptimizedContext(request.params.arguments?.project_slug as string) }] };
          case "list_projects":
            return { content: [{ type: "text", text: await para.listProjects(request.params.arguments?.status as string) }] };
          case "validate_para_integrity":
            return { content: [{ type: "text", text: await para.validateParaIntegrity() }] };
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    });
  }

  async connect(transport: any) {
    await this.server.connect(transport);
  }

  async close() {
    await this.server.close();
  }
}
