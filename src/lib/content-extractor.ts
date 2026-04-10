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

// ─── Per-product video sub-sections ──────────────────────────────────────────

const CCTV_SECTION: ProductSection = {
  title: "K-Video — CCTV Channels",
  subtitle: "IP Camera Surveillance & Video Management",
  overview:
    "K-Video's CCTV module provides centralized management of IP cameras and video streams, " +
    "delivering live monitoring, intelligent recording, and deep investigation capabilities to " +
    "security teams. Designed to scale from small installations to city-wide deployments with " +
    "thousands of cameras, it forms the video backbone for the K-Safety platform.",
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
  ],
  licensingNotes: "Annual: $100/channel/year. Perpetual: $350/channel. Year 2+ support = 20% of perpetual.",
};

const LPR_SECTION: ProductSection = {
  title: "K-Video — License Plate Recognition (LPR)",
  subtitle: "Automatic Vehicle Identification & Enforcement",
  overview:
    "The LPR module provides automatic license plate reading and matching against vehicle " +
    "databases in real time. Integrated with K-Safety, it enables instant alerts for stolen " +
    "vehicles, wanted plates, access control enforcement, and post-event investigation. Supports " +
    "high-speed road cameras and entry/exit lane readers.",
  capabilities: [
    {
      name: "Automatic Plate Reading",
      description:
        "Optical character recognition on license plates at traffic speeds, day and night, with high accuracy rates.",
    },
    {
      name: "Watchlist Matching",
      description:
        "Real-time comparison against configurable vehicle watchlists with instant alerts to operators.",
    },
    {
      name: "Access Control",
      description:
        "Automate gate/barrier control at entry points — allow, deny, or flag vehicles based on plate rules.",
    },
    {
      name: "Traffic & Journey Analysis",
      description:
        "Track vehicle journeys across multiple camera points to identify patterns and high-risk routes.",
    },
    {
      name: "Forensic Search",
      description:
        "Search historical LPR logs by plate, time range, or location for post-incident investigation.",
    },
  ],
  licensingNotes: "Annual: $500/channel/year. Perpetual: $1,750/channel. Year 2+ support = 20% of perpetual.",
};

const FACE_SECTION: ProductSection = {
  title: "K-Video — Face Recognition",
  subtitle: "Real-Time Biometric Identification",
  overview:
    "The Face Recognition module delivers real-time detection and matching of individuals against " +
    "operator-defined watchlists. Integrated directly into the K-Safety event queue, it enables " +
    "security teams to identify persons of interest instantly across any connected camera, " +
    "supporting both live monitoring and forensic investigation workflows.",
  capabilities: [
    {
      name: "Live Face Detection",
      description:
        "Continuously analyses video streams to detect and identify faces in real time, even in crowded scenes.",
    },
    {
      name: "Watchlist Matching",
      description:
        "Matches detected faces against configurable person-of-interest databases with configurable confidence thresholds.",
    },
    {
      name: "Instant Operator Alerts",
      description:
        "Triggers K-Safety events on positive identification, enabling immediate operational response.",
    },
    {
      name: "Forensic Search",
      description:
        "Search recorded video by face to locate an individual's movements across all cameras and time ranges.",
    },
    {
      name: "Privacy Controls",
      description:
        "Role-based access to facial data, audit logging, and GDPR-compliant data retention policies.",
    },
  ],
  licensingNotes: "Annual: $625/channel/year. Perpetual: $2,188/channel. Year 2+ support = 20% of perpetual.",
};

const ANALYTICS_SECTION: ProductSection = {
  title: "K-Video — Video Analytics (AI)",
  subtitle: "AI-Powered Behavioural & Scene Detection",
  overview:
    "The Video Analytics module adds AI-powered intelligence to any connected camera stream. " +
    "It detects anomalies, behaviours, and events automatically — reducing operator workload and " +
    "enabling proactive response. Detections are pushed as events into K-Safety for immediate " +
    "operator review and action.",
  capabilities: [
    {
      name: "Intrusion & Perimeter Detection",
      description:
        "Alerts on unauthorised entry into defined zones, fence crossing, and perimeter breach events.",
    },
    {
      name: "Crowd & Density Analysis",
      description:
        "Monitors crowd gathering, density thresholds, and abnormal congregation for public safety management.",
    },
    {
      name: "Object Detection",
      description:
        "Identifies abandoned objects, removed items, and unattended bags with configurable alert rules.",
    },
    {
      name: "People & Vehicle Counting",
      description:
        "Accurate bi-directional counting for pedestrian flows and vehicle throughput analytics.",
    },
    {
      name: "Loitering & Wrong Direction",
      description:
        "Detects individuals loitering beyond a defined time threshold or moving against permitted direction.",
    },
    {
      name: "Smoke & Fire Detection",
      description:
        "Early visual detection of smoke and fire signatures, supplementing traditional sensor-based systems.",
    },
  ],
  licensingNotes: "Annual: $556/channel/year. Perpetual: $1,946/channel. Year 2+ support = 20% of perpetual.",
};

// ─── Map: productId → section ─────────────────────────────────────────────────

const PRODUCT_MAP: Record<string, ProductSection> = {
  core:      K_SAFETY,
  cctv:      CCTV_SECTION,
  lpr:       LPR_SECTION,
  face:      FACE_SECTION,
  analytics: ANALYTICS_SECTION,
  kshare:    K_SHARE,
  kreact:    K_REACT,
};

/**
 * Returns the product sections for exactly the selected product IDs.
 * Each product has its own dedicated section — only selected products appear.
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
