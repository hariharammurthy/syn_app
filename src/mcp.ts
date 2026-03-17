import { randomUUID } from "crypto";
import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { recommendService, generateMarketingCopy, submitLead, getPublicInfo, listServices, getServiceDetails, compareServices, getFaqs, checkServiceFit, getConsultationInfo, getCaseStudy } from "./tools";

// ── Create the MCP server ──────────────────────────────────────────────────
const mcp = new McpServer({
  name: "synergech-mcp",
  version: "1.0.0",
});

// ── Tool 1: recommend_service ──────────────────────────────────────────────
mcp.tool(
  "recommend_service",
  "Recommends the best Synergech service based on a list of business pain points.",
  {
    painPoints: z
      .array(z.string())
      .min(1)
      .describe("List of business pain points, e.g. ['slow operations', 'manual workflows']"),
  },
  async ({ painPoints }) => {
    const result = recommendService(painPoints);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 2: generate_marketing_copy ───────────────────────────────────────
mcp.tool(
  "generate_marketing_copy",
  "Generates marketing copy for a Synergech service in a chosen format.",
  {
    service: z.string().min(1).describe("Name of the Synergech service"),
    audience: z.string().min(1).describe("Target audience, e.g. 'operations teams'"),
    format: z
      .enum(["linkedin", "email", "landing_page"])
      .describe("Output format: linkedin, email, or landing_page"),
  },
  async ({ service, audience, format }) => {
    const result = generateMarketingCopy({ service, audience, format });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 3: submit_lead ────────────────────────────────────────────────────
mcp.tool(
  "submit_lead",
  "Submits a lead for a Synergech consultation.",
  {
    name: z.string().min(1).describe("Full name of the lead"),
    email: z.string().email().describe("Email address"),
    company: z.string().min(1).describe("Company name"),
    need: z.string().min(1).describe("Primary business need or challenge"),
  },
  async ({ name, email, company, need }) => {
    const result = await submitLead({ name, email, company, need });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 4: get_public_info ───────────────────────────────────────────────────
mcp.tool(
  "get_public_info",
  "Returns Synergech's public company information, all available services, and what actions users can take. Safe for any public user.",
  {},
  async () => {
    const result = getPublicInfo();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 5: list_services ────────────────────────────────────────────────────
mcp.tool(
  "list_services",
  "Returns all Synergech services with their descriptions and benefits.",
  {},
  async () => {
    const result = listServices();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 5: get_service_details ───────────────────────────────────────────────
mcp.tool(
  "get_service_details",
  "Returns full details for a specific Synergech service by name, including description, benefits, and fit signals.",
  {
    serviceName: z.string().min(1).describe("Name of the service, e.g. 'AI Solutions'"),
  },
  async ({ serviceName }) => {
    const result = getServiceDetails(serviceName);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 7: compare_services ──────────────────────────────────────────────────────────────────────────────────────────
mcp.tool(
  "compare_services",
  "Compares two Synergech services side by side, showing descriptions, benefits, and best-fit scenarios.",
  {
    serviceA: z.string().min(1).describe("First service name, e.g. 'AI Solutions'"),
    serviceB: z.string().min(1).describe("Second service name, e.g. 'Business Process Optimization'"),
  },
  async ({ serviceA, serviceB }) => {
    const result = compareServices(serviceA, serviceB);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 8: get_faqs ──────────────────────────────────────────────────────────────────────────────────────────────
mcp.tool(
  "get_faqs",
  "Returns frequently asked questions about Synergech — pricing, timelines, consultation process, industries served, and more.",
  {},
  async () => {
    const result = getFaqs();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 9: check_service_fit ───────────────────────────────────────────────────────────────────────────────────
mcp.tool(
  "check_service_fit",
  "Checks how well a specific Synergech service fits a user's company based on their description. Returns Strong fit, Partial fit, or Not the best fit.",
  {
    serviceName: z.string().min(1).describe("Name of the service to evaluate, e.g. 'Cloud Solutions'"),
    companyDescription: z.string().min(1).describe("A brief description of the company and its challenges, e.g. 'We are a startup with remote teams struggling with scalability'"),
  },
  async ({ serviceName, companyDescription }) => {
    const result = checkServiceFit({ serviceName, companyDescription });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 10: get_consultation_info ───────────────────────────────────────────────────────────────────────────────────
mcp.tool(
  "get_consultation_info",
  "Explains what happens after booking a Synergech consultation — steps, timeline, what to prepare, and expected response time.",
  {},
  async () => {
    const result = getConsultationInfo();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── Tool 11: get_case_study ────────────────────────────────────────────────────────────────────────────────────────
mcp.tool(
  "get_case_study",
  "Returns a real-world customer success story for a specific Synergech service, including the challenge, solution, results, and timeline.",
  {
    serviceName: z.string().min(1).describe("Name of the service, e.g. 'AI Solutions'"),
  },
  async ({ serviceName }) => {
    const result = getCaseStudy(serviceName);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ── HTTP server with Streamable HTTP transport ─────────────────────────────
const app = express();
app.use(express.json());

// Stateless: one transport per POST request — simplest setup, no session state
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await mcp.connect(transport);
  await transport.handleRequest(req, res, req.body);
  res.on("finish", () => transport.close());
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, server: "synergech-mcp", version: "1.0.0" });
});

const PORT = process.env.MCP_PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
  console.log(`  Endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`  Health:   GET  http://localhost:${PORT}/health`);
});
