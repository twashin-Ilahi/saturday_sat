# Digital SAT Practice Platform - Transitions & Question Navigator

An authentic, zero-clutter **College Board Digital SAT Practice Platform** designed to mirror the official Bluebook testing interface and question bank navigation.

---

## 🌟 Architecture & Features

### 1. Unified Dashboard & Question Type Navigator
- **Domain & Skill Hierarchy**: Direct navigation across the Digital SAT syllabus:
  - **Reading and Writing**:
    - **Expression of Ideas**: *Transitions* (70 authentic questions available), *Rhetorical Synthesis*
    - **Craft and Structure**: *Words in Context*, *Text Structure and Purpose*, *Cross-Text Connections*
    - **Information and Ideas**: *Central Ideas and Details*, *Inferences*, *Command of Evidence*
    - **Standard English Conventions**: *Boundaries*, *Form, Structure, and Sense*
  - **Math**:
    - *Algebra*, *Advanced Math*, *Problem-Solving and Data Analysis*, *Geometry and Trigonometry*
- **Practice Filters**: Filter by difficulty (*Easy*, *Medium*, *Hard*) and status (*All*, *Unanswered*, *Correct*, *Missed*).
- **Interactive 70-Question Matrix**: Color-coded question grid allowing students to jump straight into any question.
- **Real-Time Performance Metrics**: Questions completed, overall accuracy rate, and missed question tally.

### 2. Authentic College Board / Bluebook Practice Interface
- **Official Metadata Table**: Assessment (`SAT`), Section (`Reading and Writing`), Domain (`Expression of Ideas`), Skill (`Transitions`), and 3-segment difficulty indicator bars.
- **Two-Column Split Workspace**:
  - **Left Pane**: Georgia serif passage with styled transition blanks (`______`) and official prompt.
  - **Right Pane**: Radio options (A, B, C, D) with hover and selected states, reveal colors for correct/incorrect, and detailed College Board rationales.
- **Top Utility Controls**:
  - `← Dashboard` back navigation.
  - Per-question timer with stopwatch controls and auto-start toggle.
  - `Question X of Y` progress indicator.
  - Quick jump selector dropdown.
  - **Missed Questions & Error Log** modal.
  - Portable **Backup Data** (JSON export) and **Load Backup** (JSON import).
  - Reset all progress.
- **Keyboard Shortcuts**:
  - `1`, `2`, `3`, `4` or `A`, `B`, `C`, `D` to choose an answer.
  - `Enter` to check answer.
  - `ArrowLeft` / `ArrowRight` to navigate questions.

### 3. Standalone Single-File Version
- Includes `public/standalone.html`, a self-contained vanilla HTML/CSS/JS file that runs offline without any build tools or dependencies.

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 💾 Data & Persistence
All student progress, answers, checked states, and error logs persist in browser `localStorage`. You can export and import progress at any time via the **Backup Data** and **Load Backup** buttons.
