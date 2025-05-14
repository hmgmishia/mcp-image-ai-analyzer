#!/usr/bin/env node
import { ImageAnalyzerServer } from "./server/ImageAnalyzerServer.js";

const server = new ImageAnalyzerServer();

server.run().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});