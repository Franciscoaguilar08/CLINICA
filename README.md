# Abk Clinical - Intelligent Population Health Platform

> **Clinical Risk Engine + Real World Evidence (RWE) Learning System**

Abk Clinical is an advanced healthcare analytics platform designed to stratify patient risk, predict readmissions, and prevent adverse events using a hybrid AI architecture.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Model](https://img.shields.io/badge/Model-XGBoost%20v2.0-blue)
![Data](https://img.shields.io/badge/Training%20Data-100k%2B%20Records-orange)

## 🧠 Core Intelligence

### 1. Hybrid Risk Engine
The platform operates on a **Dual-State Architecture**:
*   **Operational Dashboard:** Displays only the **50 Active Patients** requiring immediate clinical attention.
*   **Learning Layer (Back-End):** Continuously trains on **100,000+ hidden records** (Historical Data + Synthetic Longitudinal Cohorts).

### 2. Temporal Intelligence (Phase 2)
We moved beyond static snapshots. The engine now analyzes **Longitudinal Trajectories**:
*   **Slope Detection:** Identifies rapid deterioration trends (e.g., Glucose rising >10mg/dL/year) even within "normal" ranges.
*   **Chaos Factor:** Trained on synthetic patients with non-adherence and acute crisis patterns.

### 3. Real World Evidence (RWE)
Integrated with the **UCI Diabetes 130-US Hospitals Dataset**:
*   **Volume:** 100,000+ real clinical encounters.
*   **Ground Truth:** Validated against actual hospital readmission outcomes (<30 days).
*   **Weights:** Calibrated for Hypertension (2.8x impact) and Uncontrolled Diabetes (1.6x impact).

---

## 🛠 Tech Stack
*   **Frontend:** React 18, TailwindCSS, Lucide Icons (Dark Mode Native).
*   **Backend:** Node.js, Express.
*   **Database:** PostgreSQL (Optimized with Batch Ingestion).
*   **AI/ML:** XGBoost (Custom Implementation via JS-Bridge), Synthea-like Generators.

## 🚀 Quick Start

### Prerequisites
*   Node.js v18+
*   PostgreSQL

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    cd backend && npm install
    ```
3.  Setup Database:
    ```bash
    npm run db:init
    ```

### Running the System
1.  **Start Backend (Port 3001):**
    ```bash
    cd backend
    npm run dev
    ```
2.  **Start Frontend (Port 5173):**
    ```bash
    npm run dev
    ```

## 📊 Data Pipelines
*   **`npm run ingest:pro`**: High-speed batch import of clinical CSVs.
*   **`npm run train:auto`**: Triggers the automated retraining loop on the hidden cohort.
*   **`npm run generate:temporal`**: Creates 5,000 synthetic longitudinal patient stories.

---
*© 2026 Distant Ionosphere Research Labs*
