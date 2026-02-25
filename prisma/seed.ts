import {
  PrismaClient,
  Role,
  SessionStatus,
  Visibility,
  QuestionStatus,
} from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clean up existing data
  await prisma.questionUpvote.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.slideSet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleaned existing data\n");

  // ============================================================================
  // CREATE USERS
  // ============================================================================
  console.log("👤 Creating users...");

  const professor = await prisma.user.create({
    data: {
      utorid: "prof001",
      email: "professor@utoronto.ca",
      name: "Dr. Jane Smith",
      role: Role.PROFESSOR,
    },
  });

  const ta = await prisma.user.create({
    data: {
      utorid: "ta001",
      email: "ta@utoronto.ca",
      name: "Alex Chen",
      role: Role.TA,
    },
  });

  const student = await prisma.user.create({
    data: {
      utorid: "student001",
      email: "student@utoronto.ca",
      name: "Jordan Williams",
      role: Role.STUDENT,
    },
  });

  console.log(`  - Professor: ${professor.name}`);
  console.log(`  - TA: ${ta.name}`);
  console.log(`  - Student: ${student.name}\n`);

  // ============================================================================
  // CREATE COURSES
  // ============================================================================
  console.log("📚 Creating courses...");

  const csc108 = await prisma.course.create({
    data: {
      code: "CSC108",
      name: "Introduction to Computer Programming",
      semester: "Winter 2025",
      createdById: professor.id,
    },
  });

  const csc148 = await prisma.course.create({
    data: {
      code: "CSC148",
      name: "Introduction to Computer Science",
      semester: "Winter 2025",
      createdById: professor.id,
    },
  });

  console.log(`  - ${csc108.code}: ${csc108.name}`);
  console.log(`  - ${csc148.code}: ${csc148.name}\n`);

  // ============================================================================
  // CREATE COURSE ENROLLMENTS
  // ============================================================================
  console.log("📝 Creating enrollments...");

  // Professor enrolled as PROFESSOR in both courses
  await prisma.courseEnrollment.createMany({
    data: [
      { userId: professor.id, courseId: csc108.id, role: Role.PROFESSOR },
      { userId: professor.id, courseId: csc148.id, role: Role.PROFESSOR },
    ],
  });

  // TA enrolled as TA in both courses
  await prisma.courseEnrollment.createMany({
    data: [
      { userId: ta.id, courseId: csc108.id, role: Role.TA },
      { userId: ta.id, courseId: csc148.id, role: Role.TA },
    ],
  });

  // Student enrolled as STUDENT in both courses
  await prisma.courseEnrollment.createMany({
    data: [
      { userId: student.id, courseId: csc108.id, role: Role.STUDENT },
      { userId: student.id, courseId: csc148.id, role: Role.STUDENT },
    ],
  });

  console.log("  - All users enrolled in both courses\n");

  // ============================================================================
  // CREATE SESSIONS
  // ============================================================================
  console.log("🎓 Creating sessions...");

  const activeSession = await prisma.session.create({
    data: {
      courseId: csc108.id,
      createdById: professor.id,
      title: "Lecture 5: Functions and Scope",
      joinCode: "ABC123",
      status: SessionStatus.ACTIVE,
      isSubmissionsEnabled: true,
      startTime: new Date(),
    },
  });

  const scheduledSession = await prisma.session.create({
    data: {
      courseId: csc148.id,
      createdById: professor.id,
      title: "Lecture 1: Introduction to Data Structures",
      joinCode: "XYZ789",
      status: SessionStatus.SCHEDULED,
      isSubmissionsEnabled: false,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
  });

  console.log(`  - Active: ${activeSession.title}`);
  console.log(`  - Scheduled: ${scheduledSession.title}\n`);

  // ============================================================================
  // CREATE SLIDE SETS AND SLIDES
  // ============================================================================
  console.log("🖼️ Creating slide sets and slides...");

  // Create a SlideSet for the active session
  const slideSet = await prisma.slideSet.create({
    data: {
      sessionId: activeSession.id,
      filename: "Lecture5-Variables.pdf",
      storageKey: "sessions/seed-session/slides/seed-slideset.pdf",
      storageUrl: "/api/storage/sessions/seed-session/slides/seed-slideset.pdf",
      pageCount: 3,
      fileSize: 1024000, // 1MB example
      uploadedBy: professor.id,
    },
  });

  // Create individual slides for the SlideSet
  const slides = await Promise.all([
    prisma.slide.create({
      data: {
        slideSetId: slideSet.id,
        pageNumber: 1,
        sessionId: activeSession.id,
      },
    }),
    prisma.slide.create({
      data: {
        slideSetId: slideSet.id,
        pageNumber: 2,
        sessionId: activeSession.id,
      },
    }),
    prisma.slide.create({
      data: {
        slideSetId: slideSet.id,
        pageNumber: 3,
        sessionId: activeSession.id,
      },
    }),
  ]);

  console.log(`  - Created SlideSet: ${slideSet.filename}`);
  console.log(`  - Created ${slides.length} slides for the slide set\n`);

  // ============================================================================
  // CREATE QUESTIONS
  // ============================================================================
  console.log("❓ Creating questions...");

  // 5 Anonymous questions (null authorId)
  const anonymousQuestions = await Promise.all([
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[0].id,
        authorId: null,
        content: "What is the difference between local and global scope?",
        isAnonymous: true,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[0].id,
        authorId: null,
        content: "Can a function call itself?",
        isAnonymous: true,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.ANSWERED,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[1].id,
        authorId: null,
        content: "Why do we need parameters in functions?",
        isAnonymous: true,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[2].id,
        authorId: null,
        content: "What happens if I forget to return a value?",
        isAnonymous: true,
        visibility: Visibility.INSTRUCTOR_ONLY,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: null,
        authorId: null,
        content: "Is there a limit to function nesting?",
        isAnonymous: true,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.RESOLVED,
      },
    }),
  ]);

  // 5 Identified questions (with authorId)
  const identifiedQuestions = await Promise.all([
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[0].id,
        authorId: student.id,
        content: "How do default parameters work in Python?",
        isAnonymous: false,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[1].id,
        authorId: student.id,
        content: "Can we have multiple return statements?",
        isAnonymous: false,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.ANSWERED,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[1].id,
        authorId: ta.id,
        content: "Should we cover lambda functions in this lecture?",
        isAnonymous: false,
        visibility: Visibility.INSTRUCTOR_ONLY,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: slides[2].id,
        authorId: student.id,
        content: "What is the difference between print and return?",
        isAnonymous: false,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.OPEN,
      },
    }),
    prisma.question.create({
      data: {
        sessionId: activeSession.id,
        slideId: null,
        authorId: student.id,
        content: "When should I use a function vs writing code directly?",
        isAnonymous: false,
        visibility: Visibility.PUBLIC,
        status: QuestionStatus.OPEN,
      },
    }),
  ]);

  console.log(`  - Created ${anonymousQuestions.length} anonymous questions`);
  console.log(`  - Created ${identifiedQuestions.length} identified questions\n`);

  // ============================================================================
  // CREATE ANSWERS
  // ============================================================================
  console.log("💬 Creating answers...");

  // Answer to "Can a function call itself?" - marked as accepted
  await prisma.answer.create({
    data: {
      questionId: anonymousQuestions[1].id,
      authorId: professor.id,
      content:
        "Yes! This is called recursion. A function can call itself with different arguments to solve problems that can be broken down into smaller subproblems.",
      isAccepted: true,
    },
  });

  // Answer to "Can we have multiple return statements?"
  await prisma.answer.create({
    data: {
      questionId: identifiedQuestions[1].id,
      authorId: ta.id,
      content:
        "Yes, you can have multiple return statements. The function will exit as soon as it hits any return statement. This is useful for early returns in conditionals.",
      isAccepted: true,
    },
  });

  // Another answer to the same question
  await prisma.answer.create({
    data: {
      questionId: identifiedQuestions[1].id,
      authorId: professor.id,
      content:
        "Just to add to what Alex said - while multiple returns are valid, try to keep your functions simple. If you have too many return statements, it might be a sign that the function is doing too much.",
      isAccepted: false,
    },
  });

  // Answer to "Is there a limit to function nesting?"
  await prisma.answer.create({
    data: {
      questionId: anonymousQuestions[4].id,
      authorId: professor.id,
      content:
        "Python has a default recursion limit of about 1000 calls. You can check it with sys.getrecursionlimit(). Deep recursion can cause stack overflow errors, so it's important to have proper base cases.",
      isAccepted: true,
    },
  });

  console.log("  - Created 4 answers (3 accepted)\n");

  // ============================================================================
  // CREATE UPVOTES
  // ============================================================================
  console.log("👍 Creating upvotes...");

  // Upvote some questions
  await prisma.questionUpvote.createMany({
    data: [
      { questionId: anonymousQuestions[0].id, userId: student.id },
      { questionId: anonymousQuestions[0].id, userId: ta.id },
      { questionId: anonymousQuestions[1].id, userId: student.id },
      { questionId: identifiedQuestions[0].id, userId: ta.id },
      { questionId: identifiedQuestions[0].id, userId: professor.id },
      { questionId: identifiedQuestions[3].id, userId: ta.id },
    ],
  });

  // Update upvote counts
  await prisma.question.update({
    where: { id: anonymousQuestions[0].id },
    data: { upvoteCount: 2 },
  });
  await prisma.question.update({
    where: { id: anonymousQuestions[1].id },
    data: { upvoteCount: 1 },
  });
  await prisma.question.update({
    where: { id: identifiedQuestions[0].id },
    data: { upvoteCount: 2 },
  });
  await prisma.question.update({
    where: { id: identifiedQuestions[3].id },
    data: { upvoteCount: 1 },
  });

  console.log("  - Created 6 upvotes across 4 questions\n");

  // ============================================================================
  // VERIFY RELATIONSHIPS
  // ============================================================================
  console.log("🔍 Verifying relationships...\n");

  // Test: user.enrollments.course
  const userWithEnrollments = await prisma.user.findUnique({
    where: { id: student.id },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
    },
  });
  console.log(`✅ user.enrollments.course works:`);
  console.log(`   ${userWithEnrollments?.name} is enrolled in:`);
  userWithEnrollments?.enrollments.forEach((e) => {
    console.log(`   - ${e.course.code}: ${e.course.name}`);
  });

  // Test: question.answers.author
  const questionWithAnswers = await prisma.question.findFirst({
    where: { answers: { some: {} } },
    include: {
      answers: {
        include: {
          author: true,
        },
      },
    },
  });
  console.log(`\n✅ question.answers.author works:`);
  console.log(`   Question: "${questionWithAnswers?.content.substring(0, 50)}..."`);
  questionWithAnswers?.answers.forEach((a) => {
    console.log(`   - Answer by ${a.author.name}: "${a.content.substring(0, 40)}..."`);
  });

  // Test: anonymous questions have null authorId
  const anonQuestion = await prisma.question.findFirst({
    where: { isAnonymous: true },
  });
  console.log(`\n✅ Anonymous question verification:`);
  console.log(`   Question: "${anonQuestion?.content.substring(0, 50)}..."`);
  console.log(`   authorId: ${anonQuestion?.authorId} (should be null)`);

  console.log("\n🎉 Database seeded successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
