export interface OnboardingStep {
  title: string;
  description: string[];
  /** Optional hero image under `public/` (e.g. `/images/onboarding/foo.svg`). */
  image?: string;
  altText: string;
  icon: string;
}

export const STUDENT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to AskEasy",
    description: [
      "When your professor starts a lecture, it will appear as a live session on your dashboard.",
      'Just click "Join" on any live lecture to enter the Q&A room.',
    ],
    image: "/images/onboarding/join-class.svg",
    altText: "Joining a live lecture session",
    icon: "LogIn",
  },
  {
    title: "Ask & Get Answers Live",
    description: [
      "Post your question during lecture and it appears in the live feed instantly.",
      "TAs and your professor can reply directly, so you get answers without disrupting the lecture.",
    ],
    image: "/images/onboarding/ask-questions.svg",
    altText: "Live Q&A feed with questions and replies",
    icon: "MessageSquarePlus",
  },
  {
    title: "Upvote & Track Questions",
    description: [
      "See a question you also have? Upvote it. The most popular questions rise to the top.",
      "Questions are marked as resolved once answered. Filter between unresolved and resolved to find what you need.",
    ],
    image: "/images/onboarding/upvote.svg",
    altText: "Questions ranked by upvotes with resolution filters",
    icon: "MessageCircleReply",
  },
  {
    title: "Stay Anonymous",
    description: [
      "Toggle Anonymous Mode to hide your name from other students.",
      "TAs and professors can still see who you are to prevent misuse, but your classmates won't know.",
    ],
    image: "/images/onboarding/anonymous.svg",
    altText: "Anonymous mode toggle hiding your identity",
    icon: "Ghost",
  },
];

export const PROF_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Go Live & Share Slides",
    description: [
      "Hit 'Go Live' on any course to start a session. Students will see it appear on their dashboard.",
      "Upload your lecture slides as a PDF and students will see them in a synced split-view alongside the chat.",
    ],
    image: "/images/onboarding/go-live.svg",
    altText: "Starting a live session with slides and chat",
    icon: "MonitorUp",
  },
  {
    title: "Engage With Your Class",
    description: [
      "Students post and upvote questions in real time. The most pressing ones rise to the top.",
      "Reply in the chat or address questions verbally. You can also control whether only TAs can answer.",
    ],
    image: "/images/onboarding/interactive.svg",
    altText: "Professor replying to student questions in real time",
    icon: "Presentation",
  },
  {
    title: "Manage & Export",
    description: [
      "Assign TAs, moderate posts, and control answer permissions from within the session.",
      "When you end a session, download the full Q&A transcript as a .txt file.",
    ],
    image: "/images/onboarding/manage-room.svg",
    altText: "Session management tools and chat export",
    icon: "BookOpen",
  },
];
