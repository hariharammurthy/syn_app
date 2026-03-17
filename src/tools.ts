import { companyData } from "./companyData";
import fs from "fs";
import path from "path";

const LEADS_FILE = path.join(__dirname, "..", "leads.json");

function readLeads(): object[] {
  if (!fs.existsSync(LEADS_FILE)) return [];
  return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
}

function writeLeads(leads: object[]) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export function recommendService(painPoints: string[]) {
  const normalized = painPoints.map((p) => p.toLowerCase());

  const ranked = companyData.services.map((service) => {
    const score = service.fitSignals.reduce((acc, signal) => {
      const hit = normalized.some((p) => p.includes(signal.toLowerCase()));
      return acc + (hit ? 1 : 0);
    }, 0);

    return { service, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (!best) {
    return { recommendedService: null, why: "No matching service found.", cta: companyData.cta };
  }

  return {
    recommendedService: best.service.name,
    why: `Based on the pain points provided, ${best.service.name} is the closest fit.`,
    cta: companyData.cta
  };
}

export function generateMarketingCopy(input: {
  service: string;
  audience: string;
  format: "linkedin" | "email" | "landing_page";
}) {
  // Find matching service in companyData for tailored copy
  const matched = companyData.services.find(
    (s) => s.name.toLowerCase() === input.service.toLowerCase()
  );

  const description = matched?.description
    ?? `${input.service} helps organizations improve efficiency, reduce operational friction, and support long-term scalability.`;

  const benefitsList = matched?.benefits
    ? matched.benefits.map((b) => `* ${b}`).join("\n")
    : `* Improve operational efficiency\n* Reduce friction\n* Scale with confidence`;

  if (input.format === "linkedin") {
    return {
      title: `${input.service} for ${input.audience}`,
      body:
        `${description}\n\n` +
        `Here is what ${input.audience} teams typically gain:\n${benefitsList}\n\n` +
        `If your organization is ready to take the next step, ${companyData.cta.toLowerCase()} with Synergech.`
    };
  }

  if (input.format === "email") {
    return {
      subject: `${input.service} for ${input.audience} - let us talk`,
      body:
        `Hi,\n\n` +
        `I wanted to reach out because ${input.audience} teams often face challenges that ${input.service} is built to solve.\n\n` +
        `${description}\n\n` +
        `Key benefits for your team:\n${benefitsList}\n\n` +
        `Would you be open to a quick consultation? ${companyData.cta} at your convenience.\n`
    };
  }

  // landing_page
  return {
    headline: `${input.service} built for ${input.audience}`,
    subheadline: description,
    benefits: matched?.benefits ?? ["Improve efficiency", "Reduce friction", "Scale confidently"],
    cta: companyData.cta
  };
}

export async function submitLead(input: {
  name: string;
  email: string;
  company: string;
  need: string;
}) {
  const leadId = `lead_${Date.now()}`;
  const lead = {
    id: leadId,
    ...input,
    status: "new" as "new" | "contacted" | "qualified" | "closed",
    submittedAt: new Date().toISOString(),
  };

  const leads = readLeads();
  leads.push(lead);
  writeLeads(leads);

  console.log(`[Lead saved] ${lead.name} <${lead.email}> -- ${leads.length} total leads`);

  return {
    success: true,
    message: "Lead captured and saved successfully",
    leadId,
  };
}

// ── Tool 4: get_public_info ──────────────────────────────────────────────────
export function getPublicInfo() {
  return {
    company: companyData.company,
    tagline: "Technology solutions that help businesses grow, automate, and scale.",
    cta: companyData.cta,
    contactPrompt: "To get started, share your business challenge and we will recommend the right service for you.",
    services: companyData.services.map((s) => ({
      name: s.name,
      description: s.description,
      benefits: s.benefits,
    })),
    availableActions: [
      "Describe your business challenge to get a service recommendation",
      "Ask for marketing copy for any service",
      "Submit your contact details to book a consultation",
    ],
  };
}

// ── Tool 5: list_services ──────────────────────────────────────────────────
export function listServices() {
  return {
    company: companyData.company,
    totalServices: companyData.services.length,
    services: companyData.services.map((s) => ({
      name: s.name,
      description: s.description,
      benefits: s.benefits,
    })),
  };
}

// ── Tool 5: get_service_details ────────────────────────────────────────────
export function getServiceDetails(serviceName: string) {
  const service = companyData.services.find(
    (s) => s.name.toLowerCase() === serviceName.toLowerCase()
  );

  if (!service) {
    return {
      found: false,
      message: `Service "${serviceName}" not found. Available services: ${companyData.services.map((s) => s.name).join(", ")}`,
    };
  }

  return {
    found: true,
    id: service.id,
    name: service.name,
    description: service.description,
    benefits: service.benefits,
    fitSignals: service.fitSignals,
    cta: companyData.cta,
  };
}

// ── Tool 7: compare_services ──────────────────────────────────────────────────
export function compareServices(serviceA: string, serviceB: string) {
  const a = companyData.services.find((s) => s.name.toLowerCase() === serviceA.toLowerCase());
  const b = companyData.services.find((s) => s.name.toLowerCase() === serviceB.toLowerCase());

  if (!a) return { found: false, message: `Service "${serviceA}" not found.` };
  if (!b) return { found: false, message: `Service "${serviceB}" not found.` };

  return {
    found: true,
    comparison: [
      {
        name: a.name,
        description: a.description,
        benefits: a.benefits,
        bestFor: a.fitSignals.join(", "),
      },
      {
        name: b.name,
        description: b.description,
        benefits: b.benefits,
        bestFor: b.fitSignals.join(", "),
      },
    ],
    tip: `Choose ${a.name} if your challenge involves: ${a.fitSignals.slice(0, 2).join(" or ")}. Choose ${b.name} if your challenge involves: ${b.fitSignals.slice(0, 2).join(" or ")}.`,
    cta: companyData.cta,
  };
}

// ── Tool 8: get_faqs ────────────────────────────────────────────────────────────
export function getFaqs() {
  return {
    company: companyData.company,
    faqs: [
      {
        question: "How much do Synergech services cost?",
        answer: "Pricing is tailored to your project scope and goals. Book a consultation for a custom quote.",
      },
      {
        question: "How long does a typical project take?",
        answer: "Most engagements range from 4 to 16 weeks depending on complexity. We deliver in phases to show early results.",
      },
      {
        question: "What happens after I book a consultation?",
        answer: "A Synergech specialist will contact you within 24 hours to schedule a discovery call and understand your needs.",
      },
      {
        question: "Do you work with small businesses or only enterprises?",
        answer: "We work with businesses of all sizes — from startups to large enterprises. Our solutions are scoped to your needs and budget.",
      },
      {
        question: "What industries does Synergech serve?",
        answer: "We serve clients across technology, finance, healthcare, logistics, retail, and professional services.",
      },
      {
        question: "Can I get support after the project is delivered?",
        answer: "Yes. We offer ongoing support and maintenance packages to ensure your solution continues to perform.",
      },
    ],
  };
}

// ── Tool 9: check_service_fit ───────────────────────────────────────────────────
export function checkServiceFit(input: { serviceName: string; companyDescription: string }) {
  const service = companyData.services.find(
    (s) => s.name.toLowerCase() === input.serviceName.toLowerCase()
  );

  if (!service) {
    return { found: false, message: `Service "${input.serviceName}" not found.` };
  }

  const desc = input.companyDescription.toLowerCase();
  const matchedSignals = service.fitSignals.filter((sig) => desc.includes(sig.toLowerCase()));
  const score = matchedSignals.length;

  const fitLevel =
    score >= 3 ? "Strong fit" :
    score >= 1 ? "Partial fit" :
    "Not the best fit";

  const reasoning =
    score > 0
      ? `Your description mentions signals that align with ${service.name}: ${matchedSignals.join(", ")}.`
      : `Your description does not strongly match the typical use case for ${service.name}. Consider describing your challenge differently or exploring other services.`;

  return {
    service: service.name,
    fitLevel,
    matchedSignals,
    reasoning,
    recommendation:
      fitLevel === "Strong fit"
        ? `${service.name} is a great match. ${companyData.cta} to get started.`
        : fitLevel === "Partial fit"
        ? `${service.name} could work for you. A consultation will confirm the fit.`
        : `We recommend exploring other Synergech services or booking a consultation to find the best match.`,
    cta: companyData.cta,
  };
}

// ── Tool 10: get_consultation_info ─────────────────────────────────────────────
export function getConsultationInfo() {
  return {
    title: "How a Synergech Consultation Works",
    steps: [
      {
        step: 1,
        title: "Submit Your Details",
        description: "Share your name, email, company, and the challenge you are facing. Takes less than 2 minutes.",
      },
      {
        step: 2,
        title: "Discovery Call (24-48 hrs)",
        description: "A Synergech specialist reaches out to schedule a 20-30 minute call to understand your goals in depth.",
      },
      {
        step: 3,
        title: "Custom Proposal",
        description: "We prepare a tailored proposal with recommended services, scope, timeline, and investment estimate.",
      },
      {
        step: 4,
        title: "Kick-off",
        description: "Once aligned, we assign your team and begin the engagement with a structured onboarding session.",
      },
    ],
    whatToPrepare: [
      "A brief description of your current challenge",
      "Your goals and desired outcomes",
      "Any relevant context about your team size or tech stack",
    ],
    cta: companyData.cta,
    responseTime: "Within 24 business hours",
  };
}

// ── Tool 11: get_case_study ────────────────────────────────────────────────────
const caseStudies: Record<string, object> = {
  "cloud-solutions": {
    service: "Cloud Solutions",
    client: "A mid-size logistics company (150 employees)",
    challenge: "Their on-premise servers were causing frequent downtime, and remote teams struggled to access critical systems.",
    solution: "Synergech migrated their infrastructure to the cloud, set up secure remote access, and implemented auto-scaling.",
    results: [
      "99.9% uptime achieved within 60 days",
      "40% reduction in infrastructure costs",
      "Remote team productivity improved by 35%",
    ],
    timeline: "8 weeks",
  },
  "ai-solutions": {
    service: "AI Solutions",
    client: "A financial services firm (80 employees)",
    challenge: "Analysts were spending 60% of their time manually processing reports and extracting insights from data.",
    solution: "Synergech built an AI pipeline that automated data ingestion, analysis, and report generation.",
    results: [
      "Report processing time reduced from 6 hours to 20 minutes",
      "Analyst productivity increased by 60%",
      "Error rate in reports dropped by 90%",
    ],
    timeline: "10 weeks",
  },
  "business-process-optimization": {
    service: "Business Process Optimization",
    client: "A healthcare provider (200 employees)",
    challenge: "Patient onboarding involved 12 manual steps across 4 departments, causing delays and errors.",
    solution: "Synergech mapped and redesigned the onboarding workflow, eliminating 7 redundant steps and automating handoffs.",
    results: [
      "Onboarding time reduced from 3 days to 4 hours",
      "Staff errors reduced by 75%",
      "Patient satisfaction score improved by 28%",
    ],
    timeline: "6 weeks",
  },
  "quality-assurance": {
    service: "Quality Assurance Services",
    client: "A SaaS startup (35 employees)",
    challenge: "Frequent bugs were reaching production, damaging customer trust and increasing support costs.",
    solution: "Synergech built a full automated testing suite covering unit, integration, and end-to-end tests, integrated into their CI/CD pipeline.",
    results: [
      "Production bugs reduced by 80% in 90 days",
      "Release confidence increased — weekly deployments became daily",
      "Support ticket volume dropped by 45%",
    ],
    timeline: "5 weeks",
  },
  "digital-transformation": {
    service: "Digital Transformation",
    client: "A retail chain (500 employees)",
    challenge: "Legacy point-of-sale and inventory systems were incompatible with modern e-commerce and analytics tools.",
    solution: "Synergech replaced legacy systems with a modern cloud-based platform, integrated e-commerce, and built a real-time analytics dashboard.",
    results: [
      "Legacy system decommissioned within 16 weeks",
      "E-commerce revenue grew 55% in first quarter post-launch",
      "Inventory accuracy improved from 72% to 98%",
    ],
    timeline: "16 weeks",
  },
};

export function getCaseStudy(serviceName: string) {
  const service = companyData.services.find(
    (s) => s.name.toLowerCase() === serviceName.toLowerCase()
  );

  if (!service) {
    return {
      found: false,
      message: `No case study found for "${serviceName}". Available services: ${companyData.services.map((s) => s.name).join(", ")}.`,
    };
  }

  const study = caseStudies[service.id];
  return { found: true, ...study, cta: companyData.cta };
}

