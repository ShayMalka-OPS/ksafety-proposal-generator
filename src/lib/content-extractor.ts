// Product descriptions extracted from KSafety_KVideo_Product_Description.docx
// Organised by product ID so the proposal generator can pull only selected products.

export interface ProductSection {
  title: string;
  subtitle: string;
  overview: string;
  capabilities: { name: string; description: string }[];
  additionalSections?: { heading: string; items: string[] }[];
  licensingNotes?: string;
}

// ─── K-Safety Core Platform ──────────────────────────────────────────────────

const K_SAFETY: ProductSection = {
  title: "K-Safety",
  subtitle: "Command & Control Centre for Smart and Safe City",
  overview:
    "K-Safety is an advanced Command & Control platform developed by Kabatone, designed to help " +
    "cities, municipalities, and security agencies manage public safety operations in real time. " +
    "By unifying multiple security and operational subsystems into a single intuitive interface, " +
    "K-Safety transforms fragmented city infrastructure into a coordinated, intelligent response " +
    "capability. Built for smart city environments, K-Safety connects to video surveillance " +
    "networks, IoT devices, license plate recognition systems, video analytics engines, and face " +
    "recognition solutions — providing operators with a unified operational picture across the " +
    "entire city.",
  capabilities: [
    {
      name: "Event Management",
      description:
        "Capture, track, and resolve incidents in real time with full audit trail and escalation workflows.",
    },
    {
      name: "Task Management",
      description:
        "Assign tasks to teams and field units, monitor progress, and ensure accountability at every stage.",
    },
    {
      name: "BPM / Rules Engine",
      description:
        "Automate operational workflows with configurable business process management and rules-based event triggers.",
    },
    {
      name: "Shift Management",
      description:
        "Plan and manage operator shifts, ensuring 24/7 coverage and handover continuity.",
    },
    {
      name: "People & Vehicle Lists",
      description:
        "Maintain watchlists for persons of interest and vehicles; automatically alert operators on detection.",
    },
    {
      name: "Organizations & Users",
      description:
        "Multi-tenant structure with flexible user groups, roles, and access permissions.",
    },
    {
      name: "Reports & BI",
      description:
        "Built-in reporting and business intelligence dashboards for operational analysis and compliance.",
    },
    {
      name: "Sensors Dashboard",
      description:
        "Live status view of all connected IoT and sensor endpoints across the city.",
    },
    {
      name: "GIS / Online Map",
      description:
        "Real-time geospatial map view of incidents, units, cameras, and sensors across the city.",
    },
  ],
  additionalSections: [
    {
      heading: "Integrations & Connected Systems",
      items: [
        "CCTV / Video Surveillance",
        "License Plate Recognition (LPR)",
        "Video Analytics (AI)",
        "Facial Recognition",
        "IoT Sensors",
        "Access Control",
        "Traffic Management",
        "Fire & Safety Systems",
        "Smart Lighting",
        "Panic Buttons",
        "Environmental Sensors",
        "K-Share (Citizen App)",
      ],
    },
  ],
  licensingNotes:
    "Annual subscription from $5,000/year — includes all base modules. " +
    "Perpetual license available at 3.5× annual price. " +
    "Year 2+ support & maintenance: 20% of perpetual license value per year.",
};

// ─── K-Video VMS ─────────────────────────────────────────────────────────────

const K_VIDEO: ProductSection = {
  title: "K-Video",
  subtitle: "Intelligent Video Management System (VMS)",
  overview:
    "K-Video is Kabatone's enterprise-grade Video Management System (VMS), purpose-built for " +
    "large-scale city surveillance and security deployments. It provides centralized management " +
    "of IP cameras and video streams, delivering live monitoring, intelligent recording, and " +
    "deep investigation capabilities to security teams. Designed to scale from small " +
    "installations to city-wide deployments with thousands of cameras, K-Video forms the video " +
    "intelligence backbone for the K-Safety platform — enabling operators to monitor, record, " +
    "and analyse video footage from a single unified interface.",
  capabilities: [
    {
      name: "Live Video Monitoring",
      description:
        "Real-time viewing of multiple camera streams simultaneously, with flexible wall layouts and full-screen monitoring.",
    },
    {
      name: "Video Recording & Storage",
      description:
        "Continuous, scheduled, and event-triggered recording with configurable retention policies and storage management.",
    },
    {
      name: "Video Playback & Search",
      description:
        "Fast playback with timeline scrubbing, multi-camera synchronised review, and bookmark tools for investigations.",
    },
    {
      name: "Video Analytics (AI)",
      description:
        "AI-powered detection for motion, intrusion, crowd density, object classification, and behavioral analytics.",
    },
    {
      name: "Facial Recognition",
      description:
        "Real-time face detection and matching against watch lists, with instant operator alerts on positive identification.",
    },
    {
      name: "LPR Integration",
      description:
        "Automatic license plate reading and matching against vehicle databases, with configurable alert rules.",
    },
    {
      name: "Camera Management",
      description:
        "Centralized configuration, health monitoring, and PTZ control for all connected IP cameras and encoders.",
    },
    {
      name: "Alarm & Event Handling",
      description:
        "Automatic alarm generation on rule triggers, with direct push to the K-Safety command centre for response.",
    },
    {
      name: "GIS Map Integration",
      description:
        "Camera positions and live status displayed on a geospatial map for spatial situational awareness.",
    },
    {
      name: "Access Control Integration",
      description:
        "Links video events to access control decisions — see who entered, when, and from which camera angle.",
    },
  ],
  additionalSections: [
    {
      heading: "Video Analytics Modules",
      items: [
        "Motion Detection",
        "Intrusion Detection",
        "Perimeter Crossing",
        "Crowd Detection",
        "Object Left / Removed",
        "Facial Recognition",
        "License Plate Recognition",
        "Vehicle Classification",
        "People Counting",
        "Smoke & Fire Detection",
        "Loitering Detection",
        "Wrong Direction",
      ],
    },
    {
      heading: "Deployment & Scalability",
      items: [
        "Scalability — Supports deployments from dozens to thousands of cameras across multiple sites.",
        "Open Standards — Compatible with ONVIF and RTSP cameras from all major manufacturers.",
        "Redundancy — High-availability architecture with failover support for mission-critical environments.",
        "Cloud & On-Prem — Deployable on-premises or in a private/public cloud environment.",
        "Cybersecurity — Role-based access control, encrypted streams, audit logging, and GDPR-compliant data handling.",
      ],
    },
  ],
  licensingNotes:
    "Per-channel annual license: CCTV from $100/channel/year. " +
    "Video analytics add-ons: LPR $500, Face Recognition $625, Video Analytics (AI) $556 — all per channel/year. " +
    "Perpetual license = 3.5× annual. Year 2+ support = 20% of perpetual license value.",
};

// ─── K-Share Citizen App ─────────────────────────────────────────────────────

const K_SHARE: ProductSection = {
  title: "K-Share",
  subtitle: "Citizen Reporting Mobile Application",
  overview:
    "K-Share is a free mobile application for citizens, available on Google Play and the Apple " +
    "App Store. It enables members of the public to report incidents directly to the K-Safety " +
    "command centre, including real-time GPS location, photographs, and text descriptions. " +
    "Priced by city population tier, from included (cities up to 50,000 population) up to " +
    "$50,000/year for mega-cities.",
  capabilities: [
    {
      name: "Incident Reporting",
      description:
        "Citizens submit incidents with GPS location, photos, and description directly to the operations centre.",
    },
    {
      name: "Real-Time Alerts",
      description:
        "Push notifications sent to citizens in affected areas during active incidents or emergencies.",
    },
    {
      name: "Community Engagement",
      description:
        "Strengthens the relationship between the public and city safety operations through transparent communication.",
    },
    {
      name: "K-Safety Integration",
      description:
        "All citizen reports appear instantly in the K-Safety event queue for operator triage and response.",
    },
  ],
  licensingNotes:
    "Entry tier (≤50K population): Included with Core Platform. " +
    "Small (50K–100K): $10,000/year. Medium (100K–500K): $20,000/year. " +
    "Large (500K–1M): $35,000/year. Mega (1M+): $50,000/year.",
};

// ─── K-React First Responder App ─────────────────────────────────────────────

const K_REACT: ProductSection = {
  title: "K-React",
  subtitle: "First Responder Mobile Application",
  overview:
    "K-React is an Android-based mobile application for first responders and field units. " +
    "Command centre operators can dispatch responders, assign tasks, and track their location " +
    "in real time. Field units receive incident details, navigation support, video clips, and " +
    "two-way communication with the operations centre. Priced at $50 per device per year.",
  capabilities: [
    {
      name: "Real-Time Dispatch",
      description:
        "Operators dispatch responders from K-Safety directly to the K-React app with full incident details.",
    },
    {
      name: "Live Location Tracking",
      description:
        "GPS positions of all active field units displayed on the K-Safety GIS map in real time.",
    },
    {
      name: "Task Assignment",
      description:
        "Tasks created in K-Safety are pushed to field units and status updates flow back in real time.",
    },
    {
      name: "Video Sharing",
      description:
        "Operators can push live camera views or recorded clips to responders' mobile devices.",
    },
    {
      name: "Two-Way Communication",
      description:
        "Secure messaging between the command centre and field units during active operations.",
    },
  ],
  licensingNotes:
    "Annual license: $50/device/year. Perpetual: $175/device. " +
    "Year 2+ support = 20% of perpetual license value.",
};

// ─── Map: productId → section ─────────────────────────────────────────────────

const PRODUCT_MAP: Record<string, ProductSection> = {
  core:      K_SAFETY,
  cctv:      K_VIDEO,
  lpr:       K_VIDEO,
  face:      K_VIDEO,
  analytics: K_VIDEO,
  kshare:    K_SHARE,
  kreact:    K_REACT,
};

/**
 * Returns the unique product sections for the selected product IDs.
 * Video sub-products (cctv, lpr, face, analytics) all map to K-Video and are
 * deduplicated — K-Video appears only once if any video product is selected.
 */
export function getSelectedProductSections(
  selectedProductIds: string[]
): ProductSection[] {
  const seen = new Set<string>();
  const sections: ProductSection[] = [];

  for (const id of selectedProductIds) {
    const section = PRODUCT_MAP[id];
    if (!section) continue;
    const key = section.title;
    if (!seen.has(key)) {
      seen.add(key);
      sections.push(section);
    }
  }

  return sections;
}
