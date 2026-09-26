"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Award, Bug, Check, Download, GitFork, GraduationCap, Layers3, UserRound, Mail, MapPin, Move3D, Navigation, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Keyboard, { type KeyboardApi, type KeyboardTheme } from "@/components/keyboard";
import { projects, skills } from "@/lib/portfolio-data";

const email = "pranavkatta12344@gmail.com";
const themes: KeyboardTheme[] = ["cloud", "blue", "midnight"];

export default function Portfolio() {
  const [selected, setSelected] = useState("React");
  const [theme, setTheme] = useState<KeyboardTheme>("cloud");
  const [sound, setSound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const keyboardApi = useRef<KeyboardApi | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skill = skills.find(s => s.name === selected)!;
  const onSelect = useCallback((name: string) => setSelected(name), []);
  const onKnob = useCallback(() => setTheme(t => themes[(themes.indexOf(t) + 1) % themes.length]), []);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    const context = (document as Document & { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "explore_portfolio_skill", title: "Explore a portfolio skill",
        description: "Select one of Pranav Katta's resume skills and show its description on the interactive keyboard. Changes only this page's current selection.",
        inputSchema: { type: "object", properties: { name: { type: "string", enum: skills.map(s => s.name) } }, required: ["name"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== "object" || Object.keys(input).length !== 1 || typeof (input as { name?: unknown }).name !== "string") throw new Error("Provide exactly one skill name.");
          const chosen = skills.find(s => s.name === (input as { name: string }).name);
          if (!chosen) throw new Error("Unknown skill. Choose a name listed in the schema.");
          flushSync(() => setSelected(chosen.name));
          keyboardApi.current?.press(chosen.key);
          return { name: chosen.name, category: chosen.group, description: chosen.description };
        },
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* Enhancement is optional in unsupported browsers. */ }
    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); }
    }), { threshold: 0.06 });
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => { observer.disconnect(); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  function pickSkill(name: string, scroll = false) {
    setSelected(name);
    const s = skills.find(s => s.name === name);
    if (s) keyboardApi.current?.press(s.key);
    if (scroll) document.getElementById("keyboard")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
  }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setCopyFailed(false); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2500); }
    catch { setCopyFailed(true); }
  }

  return <TooltipProvider delayDuration={250}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a href="#" className="wordmark" aria-label="Pranav Katta home"><span className="logo-key">pk<span>↗</span></span><span>pranav katta<span className="wordmark-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#stack">Stack</a><a href="#about">About</a></nav>
      <Button asChild variant="outline" className="resume-button"><a href="/Pranav-Katta-Resume.pdf" download>Résumé <ArrowDown size={15} /></a></Button>
    </header>

    <main id="main">
      <section className="hero page-width" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="tiny-cross">+</span> HEY, I’M PRANAV</div>
          <h1 id="hero-title">Building<br />things that<br /><span className="click-word">click<span className="blue-period">.</span></span></h1>
          <p className="hero-description">Computer science student. Curious builder.<br />Turning ideas into thoughtful digital experiences.</p>
          <div className="hero-actions"><Button asChild className="primary-button"><a href="#work">Explore my work <ArrowDownRight size={18} /></a></Button><a href={`mailto:${email}`} className="text-link">Let’s talk <ArrowUpRight size={16} /></a></div>
          <div className="hero-location"><MapPin size={14} /><span>Atlanta, GA</span><span className="location-divider">/</span><span>Georgia State University</span></div>
        </div>

        <div className="keyboard-feature" id="keyboard">
          <div className="keyboard-caption"><span><span className="live-square" /> MY STACK, HANDS-ON.</span><span className="keyboard-model">AULA F75 INSPIRED</span></div>
          <div className="keyboard-stage"><span className="stage-corner corner-tl" /><span className="stage-corner corner-br" /><Keyboard selected={selected} theme={theme} sound={sound} onSelect={onSelect} onKnob={onKnob} apiRef={keyboardApi} /></div>
          <div className="keyboard-controls">
            <RadioGroup value={theme} onValueChange={v => setTheme(v as KeyboardTheme)} className="theme-options" aria-label="Keyboard color">
              {themes.map(t => <Tooltip key={t}><TooltipTrigger asChild><RadioGroupItem className={`theme-dot theme-${t}`} value={t} aria-label={`${t[0].toUpperCase() + t.slice(1)} keyboard`} /></TooltipTrigger><TooltipContent>{t === "cloud" ? "Cloud white" : t === "blue" ? "Glacier blue" : "Midnight"}</TooltipContent></Tooltip>)}
            </RadioGroup>
            <span className="drag-hint"><Move3D size={14} /> Drag to rotate · Click to explore</span>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Reset keyboard view" onClick={() => keyboardApi.current?.reset()} className="reset-button"><RotateCcw size={15} /></Button></TooltipTrigger><TooltipContent>Reset view</TooltipContent></Tooltip>
          </div>
          <div className="skill-readout" aria-live="polite" aria-atomic="true">
            <span className="selected-key">{skill.short}</span><div className="skill-readout-text"><span className="skill-category">{skill.group} <span> / PRESS {skill.key}</span></span><h2>{skill.name}</h2><p>{skill.description}</p></div>
          </div>
          <div className="keyboard-footnote"><span>Go on, try your own keyboard.</span><label htmlFor="keyboard-sound"><Volume2 size={13} /><span>Sound {sound ? "on" : "off"}</span><Switch id="keyboard-sound" size="sm" checked={sound} onCheckedChange={setSound} aria-label="Keyboard sound" /></label></div>
        </div>
      </section>

      <div className="quick-stack page-width"><span className="small-label">A FEW KEYS IN MY TOOLKIT</span><div className="quick-stack-buttons">{["React", "Next.js", "TypeScript", "Python", "Swift"].map(name => <button key={name} onClick={() => pickSkill(name)} className={selected === name ? "is-selected" : ""}><span className="mini-skill-mark">{skills.find(s => s.name === name)!.short}</span>{name}</button>)}</div><a href="#stack">All 16 skills <ArrowDownRight size={15} /></a></div>

      <section id="work" className="work-section page-width">
        <div className="section-heading reveal"><div><p className="eyebrow">01 / SELECTED WORK</p><h2>Built with purpose.<br /><span className="muted-heading">Made to be used.</span></h2></div><a href="https://github.com/Cosmo192" target="_blank" rel="noopener noreferrer" className="text-link">More on GitHub <ArrowUpRight size={17} /></a></div>
        <div className="project-grid">
          {projects.map((project, i) => <article className={`project-card project-${i} reveal`} key={project.name}>
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-cover" aria-label={`Open ${project.name}`}><span className="project-cover-top"><span>{project.number} / {project.category}</span><span className="project-open"><ArrowUpRight size={22} /></span></span><div className="project-brand">{i === 0 ? <Navigation strokeWidth={1.7} /> : i === 1 ? <Bug strokeWidth={1.6} /> : <Layers3 strokeWidth={1.5} />}<span>{project.name}<span className="project-brand-dot">.</span></span></div><span className="project-cover-bottom">{project.note}<ArrowRight size={17} /></span></a>
            <div className="project-body"><h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name} <ArrowUpRight size={18} /></a></h3><p className="project-tagline">{project.description}</p><p className="project-detail">{project.detail}</p><div className="project-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
          </article>)}
        </div>
      </section>

      <section id="stack" className="stack-section">
        <div className="page-width stack-inner"><div className="stack-intro reveal"><p className="eyebrow">02 / THE TOOLKIT</p><h2>Different tools.<br />Same curiosity.</h2><p>From web interfaces to Apple platforms, these are the languages and tools in my development toolkit.</p><a className="text-link" href="#keyboard">Meet them on the keyboard <ArrowUpRight size={17} /></a><div className="stack-count"><span>16</span><span>TECHNOLOGIES.<br />ALWAYS LEARNING.</span></div></div>
          <div className="stack-groups reveal">{(["Language", "Framework", "Tool"] as const).map((group, i) => <div className="stack-group" key={group}><div className="stack-group-heading"><h3>{["Languages", "Frameworks & libraries", "Tools & platforms"][i]}</h3><span>0{i + 1}</span></div><div className="skill-buttons">{skills.filter(s => s.group === group).map(s => <button className={`skill-button ${s.name === selected ? "active" : ""}`} key={s.name} onClick={() => pickSkill(s.name, true)} aria-label={`Explore ${s.name} on the keyboard`}><span>{s.short}</span>{s.name}<ArrowUpRight size={13} /></button>)}</div></div>)}</div>
        </div>
      </section>

      <section id="about" className="about-section page-width">
        <div className="about-copy reveal"><p className="eyebrow">03 / BEHIND THE KEYBOARD</p><h2>Learning by doing.<br /><span className="muted-heading">One build at a time.</span></h2><p>I’m Pranav, a computer science student at Georgia State University. I like taking everyday problems and turning them into useful software.</p><p>My projects bring together full-stack development, reusable interfaces, and thoughtful design—from helping students find their next class to helping teams manage their next fix.</p><div className="concept-list">{["Full-stack development", "REST APIs", "Database design", "OCR", "Computer vision", "Responsive web design"].map(c => <span key={c}>{c}</span>)}</div><div className="about-socials"><a href="https://github.com/Cosmo192" target="_blank" rel="noopener noreferrer"><GitFork size={17} /> GitHub <ArrowUpRight size={14} /></a><a href="https://www.linkedin.com/in/pranav-katta-ags20" target="_blank" rel="noopener noreferrer"><UserRound size={17} /> LinkedIn <ArrowUpRight size={14} /></a></div></div>
        <div className="about-details reveal"><div className="education-card"><div className="card-topline"><GraduationCap size={24} /><span>THE FOUNDATION</span></div><h3>Georgia State<br />University<span>.</span></h3><p>B.S. in Computer Science</p><div className="education-bottom"><span>2026 — 2030</span><span><strong>4.00</strong> GPA</span></div></div><div className="cert-card"><Award size={29} /><div><span className="small-label">CERTIFIED BY CERTIPORT</span><h3>IT Specialist:<br />Software Development</h3><p>A Pearson VUE business</p></div></div></div>
      </section>

      <section className="contact-section page-width reveal" id="contact"><div className="contact-top"><p className="eyebrow">HAVE SOMETHING IN MIND?</p><span className="contact-spark" aria-hidden="true">✳</span></div><div className="contact-main"><h2>Let’s make<br />something <em>click.</em></h2><a className="contact-arrow" href={`mailto:${email}`} aria-label="Email Pranav Katta"><ArrowUpRight strokeWidth={1.4} /></a></div><div className="contact-bottom"><a href={`mailto:${email}`}>{email} <ArrowUpRight size={16} /></a><Button variant="ghost" onClick={copyEmail} className="copy-email">{copied ? <Check size={15} /> : <Mail size={15} />}{copied ? "Copied!" : "Copy email"}</Button><span className="sr-only" role="status">{copied ? "Email address copied." : copyFailed ? `Could not copy. Email ${email}.` : ""}</span></div></section>

      <footer className="page-width"><a href="#" className="footer-name">Pranav Katta<span>.</span></a><span>Curiosity, put to work.</span><a href="/Pranav-Katta-Resume.pdf" download>Download résumé <Download size={14} /></a><a href="#" className="back-top" aria-label="Back to top">Back to top ↑</a></footer>
    </main>
  </TooltipProvider>;
}
