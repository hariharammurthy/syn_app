import express from "express";
import path from "path";
import { z } from "zod";
import { recommendService, generateMarketingCopy, submitLead } from "./tools";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ── In-memory chat sessions ────────────────────────────────────────────────
type Stage =
  | "greeting"
  | "collecting_problem"
  | "confirm_consultation"
  | "collecting_name"
  | "collecting_email"
  | "collecting_company"
  | "done";

interface Session {
  stage: Stage;
  problem: string;
  recommendedService: string;
  name: string;
  email: string;
  company: string;
}

const sessions = new Map<string, Session>();

function getSession(id: string): Session {
  if (!sessions.has(id)) {
    sessions.set(id, {
      stage: "greeting",
      problem: "",
      recommendedService: "",
      name: "",
      email: "",
      company: "",
    });
  }
  return sessions.get(id)!;
}

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body as { message: string; sessionId: string };
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const session = getSession(sessionId);
  const text = (message || "").trim();
  let reply = "";

  switch (session.stage) {
    case "greeting": {
      session.stage = "collecting_problem";
      reply = "Hi! 👋 I'm Synergech's AI assistant. What business challenge is your team currently facing?";
      break;
    }

    case "collecting_problem": {
      session.problem = text;
      // Extract keywords and call recommendService
      const keywords = text.toLowerCase().split(/[\s,\.]+/).filter(w => w.length > 3);
      const result = recommendService(keywords.length ? keywords : [text]);
      session.recommendedService = result.recommendedService ?? "Business Consulting";
      session.stage = "confirm_consultation";
      reply = `Based on what you've shared, I'd recommend **${session.recommendedService}** for your team.\n\nWould you like to book a free consultation with a Synergech specialist? (yes / no)`;
      break;
    }

    case "confirm_consultation": {
      if (/yes|sure|ok|yeah|yep|please|absolutely/i.test(text)) {
        session.stage = "collecting_name";
        reply = "Great! Let's get you connected. 😊\n\nWhat's your full name?";
      } else {
        session.stage = "greeting";
        sessions.delete(sessionId);
        reply = "No problem! Feel free to chat again anytime if you'd like to explore Synergech's services. 👋";
      }
      break;
    }

    case "collecting_name": {
      session.name = text;
      session.stage = "collecting_email";
      reply = `Nice to meet you, ${session.name}! What's your work email address?`;
      break;
    }

    case "collecting_email": {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        reply = "That doesn't look like a valid email. Could you double-check it?";
      } else {
        session.email = text;
        session.stage = "collecting_company";
        reply = "Got it! And what's your company name?";
      }
      break;
    }

    case "collecting_company": {
      session.company = text;
      session.stage = "done";
      // Submit the lead
      await submitLead({
        name: session.name,
        email: session.email,
        company: session.company,
        need: session.problem,
      });
      sessions.delete(sessionId);
      reply = `✅ All done, ${session.name}! A Synergech consultant will reach out to you at **${session.email}** within 24 hours.\n\nIs there anything else I can help you with?`;
      break;
    }

    case "done": {
      sessions.delete(sessionId);
      session.stage = "greeting";
      reply = "Starting a new conversation! What business challenge can I help you with?";
      break;
    }
  }

  res.json({ reply });
});

const recommendSchema = z.object({
  painPoints: z.array(z.string()).min(1)
});

const copySchema = z.object({
  service: z.string().min(1),
  audience: z.string().min(1),
  format: z.enum(["linkedin", "email", "landing_page"])
});

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  need: z.string().min(1)
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/recommend-service", (req, res) => {
  const parsed = recommendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(recommendService(parsed.data.painPoints));
});

app.post("/generate-copy", (req, res) => {
  const parsed = copySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(generateMarketingCopy(parsed.data));
});

app.post("/submit-lead", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await submitLead(parsed.data));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});