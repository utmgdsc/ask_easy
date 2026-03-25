export interface OnboardingStep {
  title: string;
  description: string[];
  image: string;
  altText: string;
  icon: string;
}

export const STUDENT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to AskEasy",
    description: [
      "Join your classes easily by entering the 6-character room code.",
      "You'll usually get this code from your professor's screen or syllabus.",
    ],
    image: "/images/onboarding/student-join.png",
    altText: "Join a class using a 6-character code",
    icon: "LogIn",
  },
  {
    title: "Post Questions, Not Comments",
    description: [
      "Got a question during lecture? Post it!",
      "AskEasy is meant exclusively for questions to help maintain a focused learning environment.",
      "Please refrain from posting general unstructured comments.",
    ],
    image: "/images/onboarding/student-post.png",
    altText: "Posting a question in the chat",
    icon: "MessageSquarePlus",
  },
  {
    title: "Get Answers While You Learn",
    description: [
      "TAs will monitor the chat during the lecture.",
      "They can reply directly to your questions, so you never miss a beat.",
    ],
    image: "/images/onboarding/student-answer.png",
    altText: "TA answering a student's question",
    icon: "MessageCircleReply",
  },
  {
    title: "Anonymous Mode",
    description: [
      "Feeling shy? You can toggle Anonymous Mode on.",
      "This hides your name from other students.",
      "Note: TAs and Professors can still see who you are to prevent misuse.",
    ],
    image: "/images/onboarding/student-anon.png",
    altText: "Toggling Anonymous Mode on",
    icon: "Ghost",
  },
];

export const PROF_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Go Live & Upload Slides",
    description: [
      "Start your lecture room by simply pressing 'Go Live'.",
      "Upload your presentation slides (PDF) directly from your dashboard so students can see them live.",
    ],
    image: "/images/onboarding/prof-live.png",
    altText: "Professor going live and uploading slides",
    icon: "MonitorUp",
  },
  {
    title: "Teach Interactively",
    description: [
      "As you present, students can ask questions in real-time.",
      "You can choose to respond directly in the chat, or simply address their questions verbally during the lecture.",
    ],
    image: "/images/onboarding/prof-teach.png",
    altText: "Professor teaching and viewing student questions",
    icon: "Presentation",
  },
  {
    title: "Comprehensive Documentation",
    description: [
      "AskEasy has many powerful features like downloading chat history or managing TA enrollment.",
      "For comprehensive details on all features, check out the detailed docs in the top navigation bar.",
    ],
    image: "/images/onboarding/prof-docs.png",
    altText: "Professor checking the documentation",
    icon: "BookOpen",
  },
];
