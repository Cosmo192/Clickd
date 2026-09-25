export type Skill = { name: string; short: string; key: string; group: "Language" | "Framework" | "Tool"; description: string; projects?: string[] };

export const skills: Skill[] = [
  { name: "Python", short: "Py", key: "Q", group: "Language", description: "A versatile language in my toolkit for scripting, problem solving, and working with data." },
  { name: "JavaScript", short: "JS", key: "W", group: "Language", description: "The language behind interactive interfaces and full-stack web development." },
  { name: "TypeScript", short: "TS", key: "E", group: "Language", description: "Type-safe code that keeps my components, data, and growing applications easier to work with.", projects: ["PantherNav", "Bugz", "ContextCard"] },
  { name: "React", short: "React", key: "R", group: "Framework", description: "Reusable components. Responsive interfaces. The foundation of my web projects.", projects: ["PantherNav", "Bugz", "ContextCard"] },
  { name: "Next.js", short: "Next", key: "T", group: "Framework", description: "My framework for bringing React interfaces, routing, and APIs together in one application.", projects: ["PantherNav", "Bugz", "ContextCard"] },
  { name: "Tailwind CSS", short: "TW", key: "Y", group: "Framework", description: "Utility-first styling for building consistent, responsive interfaces.", projects: ["PantherNav"] },
  { name: "Swift", short: "Swift", key: "U", group: "Language", description: "Part of my toolkit for building experiences on Apple platforms." },
  { name: "SwiftUI", short: "SUI", key: "I", group: "Framework", description: "A declarative approach to composing interfaces for Apple platforms." },
  { name: "C++", short: "C++", key: "O", group: "Language", description: "A language in my toolkit for algorithms, problem solving, and understanding how code works under the hood." },
  { name: "Node.js", short: "Node", key: "P", group: "Framework", description: "JavaScript beyond the browser, supporting full-stack development and backend tooling." },
  { name: "Git", short: "Git", key: "A", group: "Tool", description: "Version control for tracking changes and developing projects with a clear history." },
  { name: "GitHub", short: "GH", key: "S", group: "Tool", description: "A home for my code, repositories, and development workflow." },
  { name: "Supabase", short: "Supa", key: "D", group: "Tool", description: "A backend platform in my toolkit for working with application data." },
  { name: "Vercel", short: "▲", key: "F", group: "Tool", description: "From a code change to a live application, with continuous deployment workflows.", projects: ["ContextCard"] },
  { name: "Xcode", short: "XC", key: "G", group: "Tool", description: "My development environment for working with Swift and Apple-platform projects." },
  { name: "VS Code", short: "Code", key: "H", group: "Tool", description: "The editor in my everyday development toolkit." },
];

export const projects = [
  { name: "PantherNav", number: "01", category: "CAMPUS NAVIGATION", url: "https://panther-nav.vercel.app", description: "A better way to find your way around campus.", detail: "Helps Georgia State students locate classrooms, buildings, and campus resources through a responsive, intuitive interface.", tags: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Google Cloud API"], note: "Built for Georgia State students", icon: "navigation" },
  { name: "Bugz", number: "02", category: "DEVELOPER TOOLS", url: "https://bugz-orpin.vercel.app", description: "Less chasing bugs. More building together.", detail: "A collaborative platform for software teams to report, organize, and manage issues, with responsive dashboards and reusable components.", tags: ["Next.js", "React", "TypeScript"], note: "Collaborative issue tracking", icon: "bug" },
  { name: "ContextCard", number: "03", category: "AI-POWERED WEB APP", url: "https://context-card.vercel.app", description: "The context you need. Without the noise.", detail: "An AI-powered application that generates concise context cards, with reusable interfaces, smooth interactions, and a focus on performance.", tags: ["Next.js", "React", "TypeScript", "Vercel"], note: "Small cards. Useful context.", icon: "cards" },
];
