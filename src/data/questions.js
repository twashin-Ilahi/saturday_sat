import rawQuestions from './questions.json';

const LETTER_INDEX = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

export function getTransitionCategory(transitionWord = "") {
  const word = transitionWord.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  // Contrast / Disagreement / Concession
  const contrastWords = [
    'however', 'nevertheless', 'nonetheless', 'conversely', 'by contrast', 
    'in contrast', 'on the other hand', 'on the contrary', 'yet', 'still', 
    'regardless', 'despite this', 'even so', 'granted', 'admittedly', 
    'alternatively', 'instead', 'whereas'
  ];
  if (contrastWords.some(w => word === w || word.includes(w) || w.includes(word))) {
    return 'Contrast';
  }

  // Cause & Effect / Consequence
  const causeWords = [
    'therefore', 'consequently', 'as a result', 'thus', 'hence', 
    'accordingly', 'for this reason', 'because of this'
  ];
  if (causeWords.some(w => word === w || word.includes(w) || w.includes(word))) {
    return 'Cause & Effect';
  }

  // Restatement / Exemplification / Clarification
  const exemplificationWords = [
    'specifically', 'for example', 'for instance', 'in particular', 
    'that is', 'in other words', 'namely', 'to illustrate', 'put another way'
  ];
  if (exemplificationWords.some(w => word === w || word.includes(w) || w.includes(word))) {
    return 'Exemplification / Restatement';
  }

  // Sequence / Chronology
  const sequenceWords = [
    'subsequently', 'previously', 'meanwhile', 'afterward', 'finally', 
    'next', 'then', 'initially', 'simultaneously', 'earlier', 'later'
  ];
  if (sequenceWords.some(w => word === w || word.includes(w) || w.includes(word))) {
    return 'Sequence / Chronology';
  }

  // Continuation / Addition / Similarity
  return 'Continuation / Addition';
}

export const ALL_QUESTIONS = rawQuestions.map(q => {
  const choices = Array.isArray(q.options) 
    ? q.options.map(opt => typeof opt === 'string' ? opt : opt.text) 
    : (q.choices || []);

  const answerIndex = typeof q.answer === 'number' 
    ? q.answer 
    : (LETTER_INDEX[q.correctAnswer] ?? 0);

  const correctWord = choices[answerIndex] || "";

  return {
    id: q.id,
    assessment: q.assessment || "SAT",
    section: q.test || "Reading and Writing",
    domain: q.domain || "Expression of Ideas",
    skill: q.skill || "Transitions",
    difficulty: q.difficulty || "Medium",
    passage: q.passage,
    prompt: q.prompt || "Which choice completes the text with the most logical transition?",
    choices,
    answer: answerIndex,
    correctAnswerLetter: ['A', 'B', 'C', 'D'][answerIndex],
    rationale: q.rationale,
    category: q.category || getTransitionCategory(correctWord)
  };
});

export const SYLLABUS = [
  {
    section: "Reading and Writing",
    domains: [
      {
        name: "Expression of Ideas",
        description: "Revising text to improve the expression of ideas and meet communicative goals.",
        skills: [
          {
            id: "transitions",
            name: "Transitions",
            questionCount: ALL_QUESTIONS.length,
            available: true,
            description: "Choose the word or phrase that most logically links phrases, clauses, sentences, or paragraphs."
          },
          {
            id: "rhetorical-synthesis",
            name: "Rhetorical Synthesis",
            questionCount: 0,
            available: false,
            description: "Strategically integrate provided notes to achieve a specified rhetorical goal."
          }
        ]
      },
      {
        name: "Craft and Structure",
        description: "Using high-utility words and phrases, analyzing texts rhetorically, and making cross-text connections.",
        skills: [
          {
            id: "words-in-context",
            name: "Words in Context",
            questionCount: 0,
            available: false,
            description: "Determine the meaning of high-utility academic words and phrases in context."
          },
          {
            id: "text-structure-purpose",
            name: "Text Structure and Purpose",
            questionCount: 0,
            available: false,
            description: "Analyze the overall structure or rhetorical purpose of a text or part of a text."
          },
          {
            id: "cross-text-connections",
            name: "Cross-Text Connections",
            questionCount: 0,
            available: false,
            description: "Synthesize information and ideas across paired passages."
          }
        ]
      },
      {
        name: "Information and Ideas",
        description: "Locating, interpreting, evaluating, and integrating information and ideas from texts and infographics.",
        skills: [
          {
            id: "central-ideas-details",
            name: "Central Ideas and Details",
            questionCount: 0,
            available: false,
            description: "Identify stated or implied central ideas and key supporting details."
          },
          {
            id: "inferences",
            name: "Inferences",
            questionCount: 0,
            available: false,
            description: "Draw reasonable, logically sound conclusions based on evidence in the text."
          },
          {
            id: "command-of-evidence",
            name: "Command of Evidence",
            questionCount: 0,
            available: false,
            description: "Evaluate textual or quantitative evidence to support, weaken, or challenge a claim."
          }
        ]
      },
      {
        name: "Standard English Conventions",
        description: "Editing text to conform to core conventions of standard written English sentence structure, usage, and punctuation.",
        skills: [
          {
            id: "boundaries",
            name: "Boundaries",
            questionCount: 0,
            available: false,
            description: "Recognize and correctly punctuate sentence boundaries (clauses, run-ons, fragments)."
          },
          {
            id: "form-structure-sense",
            name: "Form, Structure, and Sense",
            questionCount: 0,
            available: false,
            description: "Ensure grammatical agreement (subject-verb, pronoun-antecedent, verb tense)."
          }
        ]
      }
    ]
  },
  {
    section: "Math",
    domains: [
      {
        name: "Algebra",
        description: "Analyze, solve, and create linear equations and inequalities, and solve systems of equations.",
        skills: [
          { id: "linear-equations", name: "Linear Equations & Inequalities", questionCount: 0, available: false },
          { id: "linear-functions", name: "Linear Functions", questionCount: 0, available: false },
          { id: "systems-equations", name: "Systems of Two Linear Equations", questionCount: 0, available: false }
        ]
      },
      {
        name: "Advanced Math",
        description: "Work with absolute value, quadratic, exponential, polynomial, rational, radical, and other nonlinear functions.",
        skills: [
          { id: "nonlinear-equations", name: "Nonlinear Equations & Systems", questionCount: 0, available: false },
          { id: "equivalent-expressions", name: "Equivalent Expressions", questionCount: 0, available: false }
        ]
      },
      {
        name: "Problem-Solving and Data Analysis",
        description: "Quantitative reasoning about ratios, rates, proportional relationships, and data analysis.",
        skills: [
          { id: "ratios-rates", name: "Ratios, Rates & Proportions", questionCount: 0, available: false },
          { id: "two-variable-data", name: "Two-Variable Data & Scatterplots", questionCount: 0, available: false },
          { id: "probability-statistics", name: "Probability & Statistics", questionCount: 0, available: false }
        ]
      },
      {
        name: "Geometry and Trigonometry",
        description: "Solve problems involving area, volume, lines, angles, triangles, circles, and trigonometry.",
        skills: [
          { id: "area-volume", name: "Area and Volume", questionCount: 0, available: false },
          { id: "lines-angles-triangles", name: "Lines, Angles, and Triangles", questionCount: 0, available: false },
          { id: "right-triangles-trig", name: "Right Triangles and Trigonometry", questionCount: 0, available: false },
          { id: "circles", name: "Circles", questionCount: 0, available: false }
        ]
      }
    ]
  }
];
