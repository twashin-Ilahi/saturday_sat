# Bluebook SAT Practice Platform (Transitions Mastery)

An authentic, production-grade **College Board Bluebook-style Digital SAT practice platform** specifically built for **Reading & Writing: Transitions** questions. Powered by **Google Gemini 3.8 Flash** (`gemini-flash-latest`), browser-local progress tracking, a dedicated error log clinic, and advanced question filtering.

![Bluebook SAT Practice](public/bluebook-icon.svg)

---

## 🌟 Key Features

### 1. Authentic Bluebook Testing Interface
- **Pixel-Accurate UI**: Faithfully replicates the College Board Bluebook digital SAT testing software.
- **Top Bar**: Section label (*Section 1: Reading and Writing*), collapsible directions drawer, live countdown timer with **Hide / Show** pill button, battery status indicator (`96%`), and Annotate tool.
- **Split Screen Layout**:
  - **Left Pane**: Passage display using serif typography (`Merriweather`), custom line spacing, transition blank indicators `[ ______ ]`, and text annotation highlighter.
  - **Right Pane**: Black question badge `[ 1 ]`, **Mark for Review** with red bookmark flag, **ABC Strikethrough Elimination Tool** to cross out options, and rounded option cards `(A)`, `(B)`, `(C)`, `(D)`.
- **Bottom Navigation**: Student profile name (`Mohamed Elkirsh`), interactive **Question X of Y ^** navigator popover grid, **Back** and **Next** buttons, and section submission flow.
- **Practice / Tutor Mode**: Instant answer check, official College Board rationales, and 1-click AI Tutor assistance.

### 2. Complete Official Transitions Question Bank (70 Questions)
- 70 official College Board SAT Transitions questions with complete text and rationales.
- Categorized by difficulty (*Easy*, *Medium*, *Hard*) and logical relationship (*Contrast*, *Cause & Effect*, *Addition*, *Example/Elaboration*, *Sequence*).
- Full College Board explanations breaking down why the correct choice works and why each distractor fails.

### 3. Student Progress Tracking & Dashboard
- **Local Persistence (`localStorage`)**: Saves all attempts, scores, and review flags without requiring a server account.
- **Performance Analytics**:
  - Overall accuracy percentage and questions completed.
  - Mastery breakdown across Easy, Medium, and Hard tiers with visual progress bars.
  - Test session history table recording timestamps, scores, and durations.
  - JSON backup export and import.

### 4. Dedicated Error Log & Weakness Clinic
- Aggregates every missed question automatically.
- Side-by-side comparison of your selected answer vs the correct answer.
- **One-Click In-Card Retry**: Retest questions directly inside the card to turn mistakes into points.
- **Personal Reflection Notes**: Keep notes on why you fell for specific distractor traps.
- **"Retry All Missed Questions"** clinic drill button.

### 5. Gemini 3.8 Flash AI Tutor (`gemini-flash-latest`)
- Direct integration with Google's Gemini Flash API endpoint (`gemini-flash-latest` resolving to `gemini-3.8-flash`).
- **Interactive Actions**:
  - 🔍 **Explain Logic**: Analyzes the relationship between Sentence 1 and Sentence 2.
  - ⚠️ **Why is My Choice Wrong?**: Specifically identifies the trap in your selected option.
  - 💡 **Socratic Hint**: Step-by-step guidance without giving away the answer.
  - 📘 **Transition Rules**: High-yield SAT grammar rules and elimination heuristics.
  - 💬 **Interactive Chat**: Follow-up Q&A directly with Gemini Flash.
  - 🛠️ **API & Telemetry Inspector**: Shows live latency in ms, token counts, and confirmed model version (`gemini-3.8-flash`).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/)

### Installation
```bash
git clone https://github.com/twashin-Ilahi/saturday_sat.git
cd saturday_sat
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## ⚙️ AI Configuration
In the platform settings modal (top-right gear icon):
- **API Key**: Preconfigured or customizable with your Google AI Studio API key.
- **Model**: Default `gemini-flash-latest` (Gemini 3.8 Flash). Supports testing API connectivity in real time.

---

## 📜 License
MIT
