import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ProposalData, PRODUCTS, calculatePricing } from "@/lib/pricing";

export const maxDuration = 60; // Allow up to 60s for Claude API response

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Please add it to your environment variables." },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const data: ProposalData = await req.json();
    const pricing = calculatePricing(data);

    const selectedProductNames = data.selectedProducts
      .map((id) => PRODUCTS.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const prompt = `You are writing a professional sales proposal for the K-Safety smart city safety platform by Kabatone.

Customer Details:
- Customer/Organization: ${data.customerName}
- City: ${data.city}, ${data.country}
- Contact: ${data.contactPerson} (${data.contactEmail})
- Project Name: ${data.projectName}

Selected Products: ${selectedProductNames}

Pricing Model: ${data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"}
Total Investment: $${pricing.annualTotal.toLocaleString()} per year (annual) or $${pricing.perpetualTotal.toLocaleString()} (perpetual)

Format your response with the following structure, using these exact section headers:

## Executive Summary
[2-3 sentences on the overall value proposition]

## Business Challenges Addressed
- [bullet]
- [bullet]

## Proposed Solution
[2-3 sentences describing the selected modules and how they work together]

## Key Capabilities
- [bullet per major selected product]

## Investment Overview
[1-2 sentences summarising the pricing model and 5-year value]

## Recommended Next Steps
- [bullet]
- [bullet]

Keep each section concise. Use the customer's name and city naturally throughout.
Tone: Professional, confident, customer-focused.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const narrative =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error("Error generating proposal:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal narrative. Please try again." },
      { status: 500 }
    );
  }
}