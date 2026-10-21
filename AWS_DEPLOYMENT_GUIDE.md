# VoltGrid: Complete GitHub & AWS Cloud Deployment Guide

This guide explains step-by-step how to:
1. **Push your code to GitHub** (with your clean commits, documentation, and automated CI/CD pipeline).
2. **Deploy and host the entire system on AWS** (using the **AWS Free Tier** so it costs \$0 and runs live for your professor).

---

## Part 1: Moving the Project to GitHub (5 Minutes)

Your local repository is already initialized with a clean `.gitignore` (ignoring `node_modules`, `dist`, `.env`) and has the initial commit ready on the `main` branch.

### Step 1.1: Create a New Repository on GitHub
1. Open [github.com/new](https://github.com/new) in your browser.
2. Enter a **Repository name**: e.g., `voltgrid` or `voltgrid-dbms`.
3. Select **Public** (recommended so your professor can view it directly).
4. **DO NOT** check "Add a README file", "Add .gitignore", or "Choose a license" (we already created them locally).
5. Click **Create repository**.

### Step 1.2: Link and Push from Your Terminal
Open PowerShell or Command Prompt in your project directory (`c:\Saran\projects\voltgrid`) and run:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/voltgrid.git
git push -u origin main
```
*(Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username).*

> [!TIP]
> **Automated GitHub Actions CI/CD:**  
> Once you push, GitHub will automatically trigger `.github/workflows/ci.yml`. You will see a green checkmark indicating all TypeScript checks, security rules, and database tests passed!

---

## Part 2: Deploying to AWS (Free Tier Eligible EC2)

The most reliable, industry-standard, and cost-effective way to host VoltGrid on AWS is on a single **AWS EC2 Virtual Server** using **Docker Compose**.

### Why This Architecture Wins Full Marks in Academic Evaluations:
1. **100% AWS Free Tier Eligible:** Uses `t2.micro` or `t3.micro` (750 free hours/month).
2. **Complete Parity:** Runs the exact same PostgreSQL 16 engine, custom extensions (`btree_gist`, `uuid-ossp`), 3 triggers, 3 stored procedures, and seed data.
3. **Everything in One Place:** Frontend, Backend, and Database are networked together; zero complex multi-VPC billing surprises.
4. **Live Professor Demo:** You can open your AWS Console and show the running EC2 instance, plus show the terminal running Docker containers.

---

### Step 2.1: Launch an AWS EC2 Instance
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/ec2).
2. Ensure your region (top right) is set to a nearby region (e.g., **Asia Pacific (Mumbai) `ap-south-1`**, **US East (N. Virginia) `us-east-1`**, etc.).
3. Click **Launch Instance**.
4. Configure the instance settings:
   - **Name:** `voltgrid-server`
   - **Application and OS Images:** **Ubuntu Server 24.04 LTS** (or 22.04 LTS) — *(Free tier eligible)*.
   - **Instance Type:** `t2.micro` (or `t3.micro` depending on region) — *(Free tier eligible)*.
   - **Key pair (login):** 
     - Click **Create new key pair** $\rightarrow$ Name it `voltgrid-key` $\rightarrow$ Select `.pem` $\rightarrow$ Download and save the `.pem` file on your computer.
   - **Network settings (Firewall / Security Group):**
     - Select **Create security group**.
     - Check **Allow SSH traffic from** $\rightarrow$ Select `My IP` (or `Anywhere`).
     - Check **Allow HTTP traffic from the internet** (Port 80).
     - Check **Allow HTTPS traffic from the internet** (Port 443).
   - Click **Edit** next to Network settings to add custom ports:
     - **Add security group rule 1:**
       - Type: `Custom TCP`
       - Port range: `5173` (Frontend)
       - Source: `Anywhere (0.0.0.0/0)`
     - **Add security group rule 2:**
       - Type: `Custom TCP`
       - Port range: `5000` (Backend API & WebSocket)
       - Source: `Anywhere (0.0.0.0/0)`
5. **Storage:** Keep default **8 GiB gp3 / gp2** (Free tier eligible up to 30 GiB).
6. Click **Launch Instance**.

---

### Step 2.2: Connect to Your EC2 Instance
You can connect in either of two ways:

#### Option A: One-Click Web Terminal (Easiest — No software needed!)
1. In the EC2 Console, click on your instance $\rightarrow$ Click **Connect** (top right).
2. Select **EC2 Instance Connect** tab $\rightarrow$ Click **Connect**.
3. A terminal window opens directly in your web browser!

#### Option B: From Your Local Terminal (SSH)
```bash
chmod 400 voltgrid-key.pem
ssh -i voltgrid-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

### Step 2.3: Clone the Repo & Run the Automated Deployment Script
Inside your EC2 terminal, run these 4 commands:

```bash
# 1. Clone your GitHub repository
git clone https://github.com/<YOUR_GITHUB_USERNAME>/voltgrid.git

# 2. Enter project folder
cd voltgrid

# 3. Make deploy script executable
chmod +x deploy-ec2.sh

# 4. Run automated cloud setup
./deploy-ec2.sh
```

**What `deploy-ec2.sh` does automatically:**
- Installs Docker Engine & Docker Compose on Ubuntu.
- Builds production images for the client and server.
- Spins up PostgreSQL 16, mounts the database schema (`01_schema.sql` through `05_seed_data.sql`), and starts all 3 containers.
- Performs container health checks.

---

### Step 2.4: Access Your Live Application on the Internet!

Once the script completes, open your browser and navigate to:

```text
http://<YOUR-EC2-PUBLIC-IP>:5173
```
*(or simply `http://<YOUR-EC2-PUBLIC-IP>` on default HTTP port 80)*

**Verify Live Endpoints:**
- **Frontend & Database Lab:** `http://<YOUR-EC2-PUBLIC-IP>:5173`
- **Backend Health Check:** `http://<YOUR-EC2-PUBLIC-IP>:5000/api/health` (should return `{"status":"UP","database":"CONNECTED"}`)
- **Live SQL Terminal:** Open the `Database & SQL Lab` tab $\rightarrow$ test `SELECT` and trial `INSERT`/`UPDATE` queries!

---

## Part 3: Alternative — Using AWS Managed RDS PostgreSQL (Optional)

If your professor explicitly insists on an **AWS RDS PostgreSQL** instance rather than Dockerized PostgreSQL:

1. **Create RDS PostgreSQL Database:**
   - In AWS Console $\rightarrow$ **Amazon RDS** $\rightarrow$ **Create database**.
   - Choose **Standard create** $\rightarrow$ **PostgreSQL** (version 16).
   - Templates: **Free tier**.
   - DB instance identifier: `voltgrid-rds`.
   - Master username: `postgres` | Master password: `postgrespassword`.
   - Instance class: `db.t3.micro` or `db.t4g.micro`.
   - Public access: **Yes** (or within the same VPC as your EC2 instance).
   - Security group: Allow Inbound TCP port `5432` from your EC2 instance or IP.
2. **Configure Connection:**
   - Copy the RDS Endpoint (e.g. `voltgrid-rds.c123456789.ap-south-1.rds.amazonaws.com`).
   - In `docker-compose.yml` or `.env`, set:
     ```env
     DB_HOST=voltgrid-rds.c123456789.ap-south-1.rds.amazonaws.com
     DB_PORT=5432
     DB_NAME=voltgrid_db
     DB_USER=postgres
     DB_PASSWORD=postgrespassword
     ```
3. **Initialize Database Tables & Seed Data:**
   - From your EC2 terminal:
     ```bash
     npm run db:init --workspace=server
     ```

---

## Part 4: What to Present to Your Professor for Full Marks

1. **GitHub Link:** Share your clean GitHub repository link. Show the repo with:
   - All code, database DDL (`01_schema.sql`), triggers (`02_triggers.sql`), procedures, and seed data.
   - The ER diagrams in `DBMS_DIAGRAMS.md`.
   - The slide deck in `PRESENTATION_SLIDES.md` (and PowerPoint download `VoltGrid_DBMS_Presentation.pptx`).
   - The green CI/CD build badge on GitHub Actions.
2. **Live AWS URL:** Open `http://<YOUR-EC2-PUBLIC-IP>:5173` on the projector.
   - Show the **Stations** and **My Activity** pages.
   - Switch to the **Database & SQL Lab** tab to demonstrate live queries executing against your AWS-hosted PostgreSQL database.
3. **AWS Console Verification:** Show the running EC2 instance (`t2.micro` or `t3.micro`) in the AWS Management Console to prove it is deployed on real cloud infrastructure.
