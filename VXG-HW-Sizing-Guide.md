# VXG Hardware Sizing Guide
**For K-Safety Proposals — VXG Video Management System (OEM)**

---

## How to Use This Guide

Before sizing hardware, determine the deployment type:

- **On-Premises (On-Prem):** Customer owns and operates physical servers in their data center → use [Part A](#part-a--on-premises-sizing)
- **Cloud / AWS:** Hosted on AWS using EKS and S3 → use [Part B](#part-b--aws-cloud-sizing)

The two paths use **different service ratios, resource specs, and overhead factors** — do not mix them.

Key inputs to gather from the customer before calculating:

| Input | Typical Value | Notes |
|-------|--------------|-------|
| Number of cameras | — | Total camera count |
| Average bitrate per camera | 1–4 Mbps | 1 Mbps = SD, 2 Mbps = HD, 4 Mbps = Full HD/4K |
| Video retention period | 30–90 days | Many municipalities require 60–90 days |
| Recording mode | Continuous 24/7 | Or motion-triggered (reduces storage) |
| High Availability required? | Yes/No | Adds extra nodes |

---

---

# PART A — On-Premises Sizing

*Source: VXG On-Prem HW Calculator (Excel). Use for bare-metal / data-center deployments.*

---

## A1 — On-Prem Service Table

### Core Services

| Service | Cameras per Instance | vCPU | RAM (GB) | HDD (GB) |
|---------|---------------------|------|----------|----------|
| Hosting | 160                 | 2    | 8        | 10       |
| Web     | 5,000               | 1    | 4        | 10       |
| Control | 5,000               | 1    | 4        | 10       |
| Media   | 200                 | 2    | 8        | 24       |
| CM      | 400                 | 2    | 4        | 10       |
| WebRTC  | 5,000               | 1    | 4        | 10       |

### Infrastructure Services

| Service           | Cameras per Instance | vCPU | RAM (GB) | HDD (GB) | Notes |
|-------------------|---------------------|------|----------|----------|-------|
| SQL DB Cluster    | 2,500               | 2    | 8        | 250      | Persistent disk |
| Turn Server       | 5,000               | 2    | 8        | 10       | Scales with WebRTC sessions |
| Backend/Postgres  | 10,000              | 1    | 4        | 10       | Persistent disk |

> **Note:** ELK (logging cluster) is not included in On-Prem calculator by default. Add separately if the customer requires centralized logging.

---

## A2 — On-Prem Calculation Steps

**Step 1 — Calculate instances per service:**
```
Instances = CEILING(Total Cameras ÷ Cameras per Instance)
```

**Step 2 — Calculate raw resource totals:**
```
Total vCPU = SUM(Instances × vCPU per service)
Total RAM  = SUM(Instances × RAM per service)
Total HDD  = SUM(Instances × HDD per service)
```

**Step 3 — Add Kubernetes overhead (7%):**
```
Final vCPU = Total vCPU × 1.07
Final RAM  = Total RAM  × 1.07
Final HDD  = Total HDD  × 1.07
```

**Step 4 — Determine physical node count:**

Use a reference node spec (e.g., Intel Xeon Gold 5320, 16 vCPU / 64 GB RAM / 400 GB HDD):
```
Nodes needed = CEILING(Final vCPU ÷ Node vCPU)
               — verify RAM and HDD also fit across that node count
```

VXG reference node: **14 cores / 48 GB RAM / 275 GB HDD per node** → supports ~334 cameras per node.

---

## A3 — On-Prem Worked Example — 1,000 Cameras

### Compute

| Service          | Cameras/Instance | Instances | vCPU | RAM (GB) | HDD (GB) |
|------------------|-----------------|-----------|------|----------|----------|
| Hosting          | 160             | 7         | 14   | 56       | 70       |
| Web              | 5,000           | 1         | 1    | 4        | 10       |
| Control          | 5,000           | 1         | 1    | 4        | 10       |
| Media            | 200             | 5         | 10   | 40       | 120      |
| CM               | 400             | 3         | 6    | 12       | 30       |
| WebRTC           | 5,000           | 1         | 1    | 4        | 10       |
| SQL DB Cluster   | 2,500           | 1         | 2    | 8        | 250      |
| Turn Server      | 5,000           | 1         | 2    | 8        | 10       |
| Backend/Postgres | 10,000          | 1         | 1    | 4        | 10       |
| **Subtotal**     |                 |           | **38** | **140** | **520**  |
| **+7% K8s overhead** |             |           | **41** | **150** | **556**  |

### Physical Nodes

| | Per Node | × 3 Nodes | Covers |
|---|---|---|---|
| CPU cores | 14 | 42 | ✅ 41 vCPU |
| RAM | 48 GB | 144 GB | ✅ 150 GB (slight upgrade to 3× 64 GB nodes recommended) |
| HDD | 275 GB | 825 GB | ✅ 556 GB |

**→ 3 physical servers** (recommended: Intel Xeon Gold, 16 cores / 64 GB / 400 GB each)

### Storage — On-Prem

On-Prem storage must account for **video retention + archive clips + RAID overhead**:

```
Step 1 — Video Storage (TB) = Bitrate_MB/s × Cameras × 86,400s × Retention_Days ÷ 1,000,000
Step 2 — Archive            = Video Storage × 20%
Step 3 — RAID Overhead      = (Video + Archive) × RAID Factor (see table below)
Step 4 — Total Storage      = Video + Archive + RAID
```

**RAID Factor by camera count:**

| Cameras  | Disks | RAID Overhead Factor |
|----------|-------|---------------------|
| Up to 400  | 2   | 50% (× 0.50)        |
| 401–600    | 3   | 33% (× 0.33)        |
| 601–800    | 4   | 25% (× 0.25)        |
| 801–1,000  | 5   | 20% (× 0.20)        |
| 1,001–1,200| 6   | 17% (× 0.17)        |
| 1,201–1,400| 7   | 14% (× 0.14)        |

**On-Prem storage for 1,000 cameras @ 1 Mbps / 30 days:**

```
Video   = 0.125 MB/s × 1,000 × 86,400 × 30 ÷ 1,000,000 = 324 TB
Archive = 324 × 0.20                                      =  65 TB
RAID    = (324 + 65) × 0.20                               =  78 TB
─────────────────────────────────────────────────────────────────
Total                                                     = 467 TB
```

### On-Prem Summary — 1,000 Cameras @ 1 Mbps / 30 days

| Resource | Requirement |
|----------|-------------|
| Physical Servers | **3 nodes** (16 cores / 64 GB RAM / 400 GB HDD each) |
| vCPU | 41 |
| RAM | ~144–192 GB |
| System HDD | ~556 GB |
| **Object Storage** | **~467 TB** |

---

## A4 — On-Prem Storage Quick Reference

*(Continuous recording 24/7, includes archive + RAID)*

| Cameras | Bitrate | Retention | Video (TB) | Archive (TB) | RAID (TB) | **Total (TB)** |
|---------|---------|-----------|------------|--------------|-----------|----------------|
| 500     | 1 Mbps  | 30 days   | 162        | 32           | 47        | **241**        |
| 1,000   | 1 Mbps  | 30 days   | 324        | 65           | 78        | **467**        |
| 1,000   | 2 Mbps  | 30 days   | 648        | 130          | 156       | **934**        |
| 1,000   | 1 Mbps  | 60 days   | 648        | 130          | 156       | **934**        |
| 1,000   | 1 Mbps  | 90 days   | 972        | 194          | 233       | **1,399**      |
| 2,000   | 1 Mbps  | 30 days   | 648        | 130          | 111       | **889**        |

---

---

# PART B — AWS Cloud Sizing

*Source: VXG Kubernetes Requirements (cloud documentation). Use for AWS-hosted / EKS deployments.*

---

## B1 — AWS Service Table

### Core Services

| Service | Cameras per Instance | vCPU | RAM (GB) | HDD (GB) |
|---------|---------------------|------|----------|----------|
| Hosting | 160                 | 2    | 12       | 10       |
| Web     | 2,000               | 2    | 6        | 10       |
| Control | 4,000               | 2    | 8        | 10       |
| Media   | 300                 | 2    | 8        | 24       |
| CM      | 500                 | 2    | 4        | 10       |
| WebRTC  | 2,000               | 2    | 8        | 10       |

### Infrastructure Services

| Service           | Cameras per Instance | vCPU | RAM (GB) | HDD (GB) |
|-------------------|---------------------|------|----------|----------|
| SQL DB Cluster    | 2,500               | 2    | 8        | 250      |
| ELK Cluster       | 2,500               | 1    | 8        | 500      |
| Turn Server       | 5,000               | 2    | 8        | 10       |
| Backend/Postgres  | 10,000              | 2    | 8        | 10       |

> **Note:** AWS specs are higher per instance than On-Prem because they account for cloud virtualization overhead. ELK cluster is included by default for cloud logging.

---

## B2 — AWS Calculation Steps

**Step 1 — Calculate instances per service:**
```
Instances = CEILING(Total Cameras ÷ Cameras per Instance)
```

**Step 2 — Calculate raw resource totals:**
```
Total vCPU = SUM(Instances × vCPU per service)
Total RAM  = SUM(Instances × RAM per service)
Total HDD  = SUM(Instances × HDD per service)
```

**Step 3 — Add 30% virtualization overhead:**
```
Final vCPU = Total vCPU × 1.30
Final RAM  = Total RAM  × 1.30
Final HDD  = Total HDD  × 1.30
```

**Step 4 — Map to AWS EC2 instance types (EKS worker nodes):**

| Instance Type | vCPU | RAM | Use Case |
|---|---|---|---|
| m6i.2xlarge   | 8    | 32 GB  | Small clusters (<300 cameras) |
| m6i.4xlarge   | 16   | 64 GB  | Medium clusters (300–1,000 cameras) |
| m6i.8xlarge   | 32   | 128 GB | Large clusters (1,000–3,000 cameras) |
| m6i.16xlarge  | 64   | 256 GB | Very large clusters (3,000+ cameras) |

---

## B3 — AWS Worked Example — 1,000 Cameras

### Compute

| Service          | Cameras/Instance | Instances | vCPU | RAM (GB) | HDD (GB) |
|------------------|-----------------|-----------|------|----------|----------|
| Hosting          | 160             | 7         | 14   | 84       | 70       |
| Web              | 2,000           | 1         | 2    | 6        | 10       |
| Control          | 4,000           | 1         | 2    | 8        | 10       |
| Media            | 300             | 4         | 8    | 32       | 96       |
| CM               | 500             | 2         | 4    | 8        | 20       |
| WebRTC           | 2,000           | 1         | 2    | 8        | 10       |
| SQL DB Cluster   | 2,500           | 1         | 2    | 8        | 250      |
| ELK Cluster      | 2,500           | 1         | 1    | 8        | 500      |
| Turn Server      | 5,000           | 1         | 2    | 8        | 10       |
| Backend/Postgres | 10,000          | 1         | 2    | 8        | 10       |
| **Subtotal**     |                 |           | **39** | **178** | **986**  |
| **+30% overhead**|                 |           | **51** | **232** | **1,282**|

### EC2 / EKS Node Recommendation

| Option | Nodes | Per Node | Total vCPU | Total RAM |
|--------|-------|----------|------------|-----------|
| Balanced | 4× m6i.4xlarge | 16 vCPU / 64 GB | 64 | 256 GB ✅ |
| Consolidated | 2× m6i.8xlarge | 32 vCPU / 128 GB | 64 | 256 GB ✅ |

### Storage — AWS (S3)

On AWS, **RAID is not needed** — S3 provides built-in redundancy (11 nines durability). Storage is calculated as raw video + archive only:

```
Video Storage (TB) = Bitrate_MB/s × Cameras × 86,400s × Retention_Days ÷ 1,000,000
Archive            = Video × 20%   (for permanent clips)
Total S3           = Video + Archive
```

**AWS storage for 1,000 cameras @ 1 Mbps / 30 days:**

```
Video   = 0.125 MB/s × 1,000 × 86,400 × 30 ÷ 1,000,000 = 324 TB
Archive = 324 × 0.20                                      =  65 TB
──────────────────────────────────────────────────────────────────
Total S3                                                  = 389 TB
```

> The VXG documentation uses a rounded estimate of ~350 TB (video only). Including archive gives ~389 TB.

### AWS Summary — 1,000 Cameras @ 1 Mbps / 30 days

| Resource | Requirement |
|----------|-------------|
| EKS Worker Nodes | **4× m6i.4xlarge** (or 2× m6i.8xlarge) |
| vCPU | 51 (64 provisioned) |
| RAM | 232 GB (256 GB provisioned) |
| EBS (node disks) | ~1.3 TB |
| **S3 Storage** | **~389 TB** |

---

## B4 — AWS EC2 Quick Reference by Camera Count

| Cameras | EKS Nodes | vCPU | RAM | S3 @ 1 Mbps / 30 days |
|---------|-----------|------|-----|------------------------|
| 300     | 2× m6i.2xlarge | 16 | 64 GB | ~117 TB |
| 500     | 2× m6i.4xlarge | 32 | 128 GB | ~195 TB |
| 1,000   | 4× m6i.4xlarge | 64 | 256 GB | ~389 TB |
| 2,000   | 4× m6i.8xlarge | 128 | 512 GB | ~778 TB |
| 5,000   | 8× m6i.8xlarge | 256 | 1,024 GB | ~1,944 TB |

---

---

# PART C — Side-by-Side Comparison

*1,000 cameras, 1 Mbps average bitrate, 30 days retention*

| | On-Premises | AWS Cloud |
|---|---|---|
| **Overhead factor** | 7% (Kubernetes only) | 30% (full virtualization) |
| **vCPU required** | 41 | 51 |
| **RAM required** | ~144 GB | 232 GB |
| **System disk** | ~556 GB | ~1,282 GB |
| **Storage** | **~467 TB** (incl. RAID) | **~389 TB** (S3, no RAID) |
| **Physical servers** | 3× dedicated servers | 4× EC2 m6i.4xlarge |
| **ELK logging** | Optional / separate | Included |
| **Storage redundancy** | RAID (manual) | Built-in (S3) |
| **CapEx** | High (server purchase) | Low (OpEx monthly) |
| **Scalability** | Manual (add servers) | Elastic (auto-scale) |

---

# PART D — General Notes

1. **LPR / Face Recognition / Video Analytics:** AI inference workloads are **not included** in VXG base sizing. Add dedicated GPU nodes separately (AWS: `g4dn.xlarge` or `g5.xlarge`; On-Prem: NVIDIA GPU server).
2. **High Availability:** For production, run ≥2 replicas per service. Add +1 node on-prem, or enable Multi-AZ on AWS.
3. **Bitrate is critical:** Always confirm actual average bitrate with the customer. Estimates can be wrong by 2–4× if cameras are set to higher quality than assumed.
4. **Retention:** Many municipalities require 60–90 days. Double or triple storage estimates accordingly.
5. **Network bandwidth:** 1,000 cameras at 1 Mbps = 1 Gbps sustained inbound. Provision sufficient internet/LAN bandwidth.
6. **K-Safety app servers:** The above covers VXG VMS only. K-Safety application servers (per K-Safety sizing rules) are separate and must be added to the total.
7. **DMZ server:** Required on-prem if K-Share or K-React mobile apps are included in the proposal.

---

*Last updated: April 2026 | Sources: VXG Kubernetes Requirements doc (cloud) + VXG On-Prem HW Calculator (Excel)*
