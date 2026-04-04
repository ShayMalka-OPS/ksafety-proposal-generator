import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ProposalData, PRODUCTS, calculatePricing } from "@/lib/pricing";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const data: ProposalData = await req.json();
    const pricing = calculatePricing(data);

    const selectedProductNames = data.selectedProducts
      .map((id) => PRODUCTS.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const prompt = `You are writing a professional sales proposal for the K-Safety smart city safety platform by Kabatone.

Customer Details:
- Customer/City: ${data.customerName}
- City: ${data.city}, ${data.country}
- Contact: ${data.contactPerson} (${data.contactEmail})
- Project Name: ${data.projectName}

Selected Products: ${selectedProductNames}

Pricing Model: ${data.pricingModel === "annual" ? "Annual Subscription" : "Perpetual License"}
Total Investment: $${pricing.annualTotal.toLocaleString()} per year (annual) or $${pricing.perpetualTotal.toLocaleString()} (perpetual)

Write an executive summary for this proposal. It should:
1. Open with a strong value proposition specific to ${data.city}'s needs as a smart city
2. Briefly describe what K-Safety is and why it's the right platform
3. Highlight 2-3 key benefits of the selected products (${selectedProductNames})
4. Reference the investment level and ROI potential
5. Close with a clear call to action

Tone: Professional, confident, customer-focused.
Length: 3-4 paragraphs (about 250-350 words).
Do NOT use bullet points — write in flowing prose.
Do NOT include a heading — start directly with the content.`;

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
      { error: "Failed to generate proposal narrative" },
      { status: 500 }
    );
  }
}
