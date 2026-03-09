export default function footer() {
  return (
    <footer className="w-full bg-stone-50 text-stone-800 rounded-t-lg z-10 relative">
      <div className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h2 className="text-lg font-semibold text-stone-900 tracking-wide uppercase">
              Contact Us
            </h2>
            <a
              href="mailto:[EMAIL_ADDRESS]"
              className="hover:text-stone-900 transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              [EMAIL_ADDRESS]
            </a>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-4">
            <h2 className="text-lg font-semibold text-stone-900 tracking-wide uppercase">
              Support
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
              <a href="#" className="hover:text-stone-900 transition-colors duration-200">
                For Professors
              </a>
              <span className="text-stone-800 hidden md:inline">•</span>
              <a href="#" className="hover:text-stone-900 transition-colors duration-200">
                For Students
              </a>
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-8 border-t border-stone-300/50 
            flex flex-col md:flex-row items-center justify-between text-sm 
            text-stone-800 w-full gap-4"
        >
          <p>© {new Date().getFullYear()} AskEasy. All rights reserved.</p>
          <div className="flex flex-wrap justify-center space-x-4"></div>
        </div>
      </div>
    </footer>
  );
}
