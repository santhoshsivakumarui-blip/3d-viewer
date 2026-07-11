import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini Client with correct user-agent telemetry headers
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// AI Chat Endpoint for BIM and Architectural queries
app.post("/api/gemini/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured in the workspace settings. Please configure GEMINI_API_KEY in Secrets.",
      });
    }

    const { prompt, history, activeModelInfo } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter." });
    }

    // Compose a system instruction detailing the BIM/IFC domain expertise
    const systemInstruction = 
      "You are an expert BIM (Building Information Modeling) and structural engineering AI consultant integrated into a professional 3D IFC model viewer. " +
      "Your role is to assist architects, engineers, and construction managers in analyzing building designs, understanding IFC standards (IFC2x3, IFC4, IFC5), " +
      "clarifying architectural terminology, resolving spatial conflicts, explaining fire safety codes, and estimating material volumes. " +
      "Provide highly professional, mathematically precise, structural and architectural advice. Keep descriptions clear and structured with bullet points. " +
      "If the user asks about the currently active model, refer to this context: " + JSON.stringify(activeModelInfo || "No model is currently loaded.");

    // Format chat history for the generateContent parameters
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: { role: string; text: string }) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Append the current prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

async function startServer() {
  // Vite dev server middleware integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
