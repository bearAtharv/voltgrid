# VoltGrid UI/UX & Domain Engineering Invariants

## 1. Visual Aesthetics & Theme Palette
* **No Cyberpunk / Oversaturated Neon:** Avoid neon gradients, glowing cyan/magenta borders, and matrix-like terminal themes.
* **Warm, Modern Dark Theme:** Use a refined, soft zinc/slate palette:
  - Background: `#09090b` (Zinc 950)
  - Card Surfaces: `#18181b` (Zinc 900) with 60-80% opacity
  - Borders: 1px subtle ambient `#27272a` (Zinc 800)
  - Text Hierarchy: Primary `#f4f4f5` (Zinc 100), Muted `#a1a1aa` (Zinc 400)
  - Single Accent: Purposeful, muted emerald (`#10b981`) for active/ready states and sky (`#0284c7`) for technicians.
* **Finesse & Structural Rhythm:** Use generous spacing (`gap-5`, `p-5`, `rounded-3xl` for major cards), subtle hover transitions, and system-native legible typography.

## 2. Domain & Economic Realism (Indian EV Infrastructure)
* **Authentic Commercial Pricing:** Never use arbitrary inflated rates (e.g. ₹22/kWh). Always adhere to real-world commercial Indian electricity tariffs:
  - Slow AC / Off-Peak Solar: ₹4.50 – ₹5.50 / kWh
  - City Commercial Standard: ₹6.50 – ₹7.50 / kWh
  - Highway Ultra-Fast DC: ₹11.50 – ₹13.00 / kWh
  - Standard 25–35 kWh charge must calculate to ₹100 – ₹350.
* **Localized Context:** Use real Indian metro hubs (Bengaluru, Mumbai, Gurugram NCR) and common Indian EV vehicle models (Tata Nexon EV Max, Hyundai Ioniq 5, MG ZS EV, Mahindra XUV400).

## 3. Human-Crafted Scheduling UX
* **Time-Slot Matrix:** Avoid raw, error-prone `<input type="datetime-local">` fields.
* **Selectable Date Pills:** Provide intuitive Day Selectors (*Today*, *Tomorrow*, *Day +2*, *Day +3*).
* **2-Hour Slot Windows:** Offer standard 2-hour interval cards (Early Morning, Morning Flow, Mid-Day, Afternoon, Evening Peak, Night Eco, Late Night Off-Peak).

## 4. Role-Based Privacy & Information Hiding
* **Consumer Driver Privacy:** Regular drivers must never see personal identification, contact information, or individual booking records of other users.
* **Aggregate Capacity Display:** Drivers only see aggregate station availability (e.g., *"3 of 4 bays available"*) and their own personal activity/receipts.
* **Elevated Views:** Platform-wide telemetry, cross-driver leaderboard rankings, and hardware maintenance dispatch work orders are strictly role-gated to Technicians (`TECHNICIAN`) and Administrators (`ADMIN`).

## 5. Docker & API Networking Invariants
* **Dynamic API URL Resolution:** When running static SPA clients (e.g. `serve` on port 5173), frontend fetch requests must dynamically resolve to `http://<hostname>:5000/api` to prevent 404 fallback routing against the static file server.
