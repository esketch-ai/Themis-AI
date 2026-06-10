#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { ThemisServer } from "./mcp/server.js";
import { initializeProject } from "./core/init.js";

const args = process.argv.slice(2);

if (args.includes("init")) {
  initializeProject(process.cwd()).then((success) => {
    if (success) {
      console.error("✅ Themis PARA structure initialized successfully.");
    } else {
      console.error("❌ Initialization failed.");
      process.exit(1);
    }
  });
} else {
  const isSSMode = args.includes("--sse") || process.env.THEMIS_TRANSPORT === "sse" || !!process.env.PORT;

  if (isSSMode) {
    const app = express();
    app.use(express.json());
    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req: any, res: any) => {
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);
      const sessionServer = new ThemisServer();
      await sessionServer.connect(transport);
      req.on("close", () => {
        transports.delete(transport.sessionId);
      });
    });

    app.post("/messages", async (req: any, res: any) => {
      const sessionId = req.query.sessionId as string;
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(404).send(`Session not found: ${sessionId}`);
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.error(`Themis Server (SSE) on port ${PORT}`));
  } else {
    const server = new ThemisServer();
    const transport = new StdioServerTransport();
    server.connect(transport).catch(console.error);
    console.error("Themis Server (Stdio) running");
  }
}
