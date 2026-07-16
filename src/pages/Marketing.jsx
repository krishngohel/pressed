import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, FolderOpen, Sparkles, Kanban, Mail, FileText,
  GraduationCap, Wrench, Briefcase, Lightbulb, Plus, Pencil,
} from 'lucide-react'
import Reveal from '../components/Reveal'
import { useAuth } from '../context/AuthContext'

const openAuth = (mode) => window.dispatchEvent(new CustomEvent('pressed:auth', { detail: { mode } }))

/* ================================================================== */
/*  Hero                                                               */
/* ================================================================== */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-24 md:pt-32">
      {/* ambient decoration */}
      <div className="animate-drift pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-navy-s opacity-50 blur-3xl" />
      <div className="animate-drift pointer-events-none absolute -left-40 top-64 h-80 w-80 rounded-full bg-moss-s opacity-40 blur-3xl" style={{ animationDelay: '-7s' }} />

      <div className="relative mx-auto max-w-6xl">
        <p className="animate-rise font-mono text-xs uppercase tracking-[0.2em] text-graphite" style={{ '--rise-delay': '0ms' }}>
          Pressed by Meridia
        </p>
        <h1
          className="animate-rise mt-6 max-w-4xl font-display text-[44px] font-medium leading-[0.98] tracking-tight text-ink sm:text-[64px] md:text-[88px]"
          style={{ '--rise-delay': '120ms' }}
        >
          Your career, <em className="text-navy">polished</em>.
        </h1>
        <p className="animate-rise mt-7 max-w-xl text-lg leading-relaxed text-graphite" style={{ '--rise-delay': '260ms' }}>
          One vault for everything you've done. AI that tailors a beautiful resume to every role.
          A tracker that never lets a follow-up slip. Walk into every interview freshly pressed.
        </p>
        <div className="animate-rise mt-9 flex flex-wrap items-center gap-3" style={{ '--rise-delay': '380ms' }}>
          <button onClick={() => openAuth('signup')} className="btn-primary !px-8 !py-3.5 text-base">
            Start free <ArrowRight size={16} />
          </button>
          <a href="#how" className="btn-secondary !px-8 !py-3.5 text-base">See how it works</a>
        </div>

        {/* Contrast table: Old way vs Pressed */}
        <Reveal className="mt-16 max-w-2xl" delay={150}>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 border-b border-rule bg-cream">
              <p className="px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-stone">The old way</p>
              <p className="border-l border-rule px-6 py-3.5 font-display text-sm italic text-navy">Pressed</p>
            </div>
            {[
              ['A spreadsheet, six tabs, and chaos', 'One structured Vault of your whole career'],
              ['The same generic resume for every job', 'AI-tailored, beautifully typeset for each role'],
              ['Follow-ups remembered too late', 'Gmail scanned — deadlines surfaced for you'],
            ].map(([oldWay, newWay], i) => (
              <div key={i} className="grid grid-cols-2 border-b border-rule last:border-b-0">
                <p className="px-6 py-4 text-sm text-stone line-through decoration-rule">{oldWay}</p>
                <p className="flex items-start gap-2 border-l border-rule px-6 py-4 text-sm text-ink">
                  <Check size={15} className="mt-0.5 shrink-0 text-moss" /> {newWay}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Mockup — faithful Resume Builder chrome with gentle parallax       */
/* ================================================================== */

const mockVault = [
  {
    icon: Briefcase, label: 'Work Experience', count: 3, open: true,
    entries: [
      { title: 'Senior Product Designer', org: 'Figma · San Francisco', dates: '2022 — Present' },
      { title: 'Product Designer', org: 'Notion · Remote', dates: '2019 — 2022' },
    ],
  },
  { icon: GraduationCap, label: 'Education', count: 1, entries: [{ title: 'B.S. Cognitive Science', org: 'UC San Diego', dates: '2015 — 2019' }] },
  { icon: Wrench, label: 'Skills', count: 12 },
  { icon: Lightbulb, label: 'Projects', count: 4 },
]

function MockResume() {
  return (
    <div className="h-full overflow-hidden bg-white px-8 py-7" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="text-center">
        <p className="text-[17px] font-bold tracking-wide text-[#222]" style={{ fontVariant: 'small-caps' }}>Maya Chen</p>
        <p className="mt-0.5 text-[8.5px] text-[#444]">
          San Francisco, CA &nbsp;|&nbsp; maya.chen@gmail.com &nbsp;|&nbsp; linkedin.com/in/mayachen &nbsp;|&nbsp; mayachen.design
        </p>
      </div>

      {[
        {
          heading: 'Experience',
          body: (
            <>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-[9.5px] font-bold text-[#222]">Senior Product Designer</p>
                <p className="text-[8.5px] italic text-[#444]">May 2022 — Present</p>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-[8.5px] italic text-[#444]">Figma</p>
                <p className="text-[8.5px] italic text-[#444]">San Francisco, CA</p>
              </div>
              <ul className="ml-4 mt-1 list-disc space-y-0.5 text-[8.5px] leading-snug text-[#333]">
                <li>Led redesign of the multiplayer editing experience used by 4M+ weekly designers</li>
                <li className="relative rounded-sm outline outline-1 outline-offset-1 outline-[var(--navy-s)]">
                  Shipped design system tokens adopted by 40+ product teams, cutting UI drift 60%
                  <span className="absolute -right-4 -top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--navy)] text-[8px] text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>✎</span>
                </li>
                <li>Ran 30+ usability studies; findings informed three top-line roadmap bets</li>
              </ul>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-[9.5px] font-bold text-[#222]">Product Designer</p>
                <p className="text-[8.5px] italic text-[#444]">Aug 2019 — May 2022</p>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-[8.5px] italic text-[#444]">Notion</p>
                <p className="text-[8.5px] italic text-[#444]">Remote</p>
              </div>
              <ul className="ml-4 mt-1 list-disc space-y-0.5 text-[8.5px] leading-snug text-[#333]">
                <li>Designed databases & templates surface from zero to 1.2M monthly creators</li>
                <li>Partnered with growth to lift activation 18% via onboarding experiments</li>
              </ul>
            </>
          ),
        },
        {
          heading: 'Education',
          body: (
            <div className="mt-1.5 flex items-baseline justify-between">
              <div>
                <p className="text-[9.5px] font-bold text-[#222]">University of California, San Diego</p>
                <p className="text-[8.5px] italic text-[#444]">B.S. Cognitive Science, HCI specialization</p>
              </div>
              <p className="text-[8.5px] italic text-[#444]">2015 — 2019</p>
            </div>
          ),
        },
        {
          heading: 'Skills',
          body: (
            <p className="mt-1.5 text-[8.5px] leading-snug text-[#333]">
              <b>Design:</b> Figma, prototyping, design systems, accessibility &nbsp;•&nbsp; <b>Research:</b> usability testing, journey mapping &nbsp;•&nbsp; <b>Code:</b> HTML/CSS, React basics
            </p>
          ),
        },
      ].map((section) => (
        <div key={section.heading} className="mt-3">
          <p className="border-b border-[#222] pb-0.5 text-[10px] tracking-wide text-[#222]" style={{ fontVariant: 'small-caps' }}>
            {section.heading}
          </p>
          {section.body}
        </div>
      ))}
    </div>
  )
}

function Mockup() {
  const ref = useRef(null)

  // Gentle parallax: the shell eases up as it scrolls through the viewport.
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight))
        el.style.transform = `translateY(${(1 - progress) * 44}px)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section className="px-5 pb-28">
      <Reveal variant="scale" className="mx-auto max-w-6xl">
        <div ref={ref} className="mockup-shell overflow-hidden rounded-2xl border border-rule bg-cream shadow-lift transition-transform duration-200 ease-out will-change-transform">
          {/* browser chrome */}
          <div className="flex items-center gap-3 border-b border-rule bg-paper px-4 py-3">
            <span className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#EC6A5E]" />
              <span className="h-3 w-3 rounded-full bg-[#F4BF4F]" />
              <span className="h-3 w-3 rounded-full bg-[#61C554]" />
            </span>
            <span className="mx-auto flex w-full max-w-sm items-center justify-center rounded-md border border-rule bg-cream px-3 py-1 font-mono text-[11px] text-stone">
              pressed.app/resume
            </span>
            <span className="w-12" />
          </div>

          {/* app nav inside the mock */}
          <div className="flex items-center justify-between border-b border-rule bg-paper/80 px-5 py-2.5">
            <div className="flex items-center gap-5">
              <span className="font-display italic text-base text-ink">Pressed</span>
              <span className="hidden gap-1 sm:flex">
                {['Vault', 'Resume', 'Tracker', 'Inbox'].map((l) => (
                  <span key={l} className={`rounded-full px-2.5 py-1 text-[11px] ${l === 'Resume' ? 'bg-navy-s font-medium text-navy-p' : 'text-graphite'}`}>{l}</span>
                ))}
              </span>
            </div>
            <span className="pill-navy">Pro · renews Jul 4</span>
          </div>

          <div className="grid md:grid-cols-[280px_1fr]">
            {/* Left: vault panel */}
            <div className="hidden border-r border-rule bg-paper/60 p-4 md:block">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone">Your Vault</p>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-cream"><Plus size={11} /></span>
              </div>
              <div className="space-y-2">
                {mockVault.map((section) => (
                  <div key={section.label} className={`rounded-card border ${section.open ? 'border-navy/30 bg-cream shadow-card' : 'border-rule bg-cream/60'} p-3`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-medium text-ink">
                        <section.icon size={13} className={section.open ? 'text-navy' : 'text-stone'} /> {section.label}
                      </span>
                      <span className="font-mono text-[10px] text-stone">{section.count}</span>
                    </div>
                    {section.entries && section.open !== false && (
                      <div className="mt-2.5 space-y-2">
                        {section.entries.map((e) => (
                          <div key={e.title} className="rounded-lg border border-rule bg-paper/70 px-2.5 py-2">
                            <p className="truncate text-[11px] font-medium text-ink">{e.title}</p>
                            <p className="truncate text-[10px] text-graphite">{e.org}</p>
                            <p className="font-mono text-[9px] text-stone">{e.dates}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-card border border-dashed border-stone/50 p-3 text-center">
                <p className="text-[10px] text-graphite">Drop an old resume here —<br />AI fills your vault.</p>
              </div>
            </div>

            {/* Right: PDF preview frame */}
            <div className="bg-paper/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">Figma — Senior PD.pdf</span>
                  <span className="pill-moss">Tailored</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-rule bg-cream px-3 py-1 text-[11px] text-graphite"><Pencil size={11} /> Click any line to edit</span>
                  <span className="rounded-full bg-navy px-3.5 py-1 text-[11px] font-medium text-cream">Download PDF</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-rule shadow-card" style={{ aspectRatio: '8.5 / 9.2' }}>
                <MockResume />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ================================================================== */
/*  How it works                                                       */
/* ================================================================== */

const steps = [
  { n: '01', icon: FolderOpen, title: 'Build your Vault', body: 'Every job, project, degree and skill — structured once, reused forever. Upload an old resume and AI files it for you.' },
  { n: '02', icon: Sparkles, title: 'Generate with AI', body: 'Paste a job description. Claude selects your most relevant work, rewrites bullets to match, and typesets a flawless PDF.' },
  { n: '03', icon: Kanban, title: 'Track and win', body: 'Drag applications through your pipeline while the Gmail scanner surfaces interviews, offers and deadlines automatically.' },
]

function HowItWorks() {
  return (
    <section id="how" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">How it works</p>
          <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            Three steps from <em className="text-navy">scattered</em> to <em className="text-navy">suited</em>.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 140} className="h-full">
              <div className="card card-hover h-full p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-s text-navy"><s.icon size={19} /></span>
                  <span className="font-mono text-sm text-stone">{s.n}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl text-ink">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-graphite">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Feature sections — alternating                                     */
/* ================================================================== */

function VaultVisual() {
  return (
    <div className="card space-y-2.5 p-5">
      {[
        { icon: Briefcase, label: 'Work Experience', n: '3 entries', pct: 100 },
        { icon: GraduationCap, label: 'Education', n: '1 entry', pct: 100 },
        { icon: Wrench, label: 'Skills', n: '12 skills', pct: 80 },
        { icon: Lightbulb, label: 'Projects', n: '4 projects', pct: 66 },
      ].map((row) => (
        <div key={row.label} className="rounded-card border border-rule bg-paper/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-medium text-ink"><row.icon size={15} className="text-navy" /> {row.label}</span>
            <span className="font-mono text-xs text-stone">{row.n}</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rule">
            <div className="h-full rounded-full bg-navy transition-all duration-1000 ease-editorial" style={{ width: `${row.pct}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-center font-mono text-xs text-graphite">Vault completeness — 86%</p>
    </div>
  )
}

function ResumeVisual() {
  return (
    <div className="card p-5">
      <div className="rounded-lg border border-rule bg-white p-5" style={{ fontFamily: 'Georgia, serif' }}>
        <p className="text-center text-sm font-bold text-[#222]" style={{ fontVariant: 'small-caps' }}>Maya Chen</p>
        <p className="mt-3 border-b border-[#222] pb-0.5 text-[10px] text-[#222]" style={{ fontVariant: 'small-caps' }}>Experience</p>
        <p className="mt-1.5 text-[10px] font-bold text-[#222]">Senior Product Designer · Figma</p>
        <p className="mt-1 rounded-sm bg-navy-s/60 px-1 text-[9px] leading-relaxed text-[#333]">
          Shipped design system tokens adopted by 40+ product teams, cutting UI drift 60%
        </p>
        <p className="mt-1 px-1 text-[9px] leading-relaxed text-[#333]">Ran 30+ usability studies informing three roadmap bets</p>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-card border border-navy/25 bg-navy-s/40 p-3.5">
        <Sparkles size={15} className="shrink-0 text-navy" />
        <p className="text-xs leading-relaxed text-navy-p">
          <b>Tailored for “Staff Designer, Linear”:</b> emphasized systems work, surfaced your tokens project, rewrote 4 bullets with role keywords.
        </p>
      </div>
    </div>
  )
}

function TrackerVisual() {
  const cols = [
    { name: 'Applied', items: [['Linear', 'Staff Designer'], ['Vercel', 'Design Engineer']] },
    { name: 'Interview', items: [['Stripe', 'Product Designer']] },
    { name: 'Offer', items: [['Notion', 'Senior PD']], moss: true },
  ]
  return (
    <div className="card p-5">
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col) => (
          <div key={col.name}>
            <p className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-stone">
              {col.name} <span className="font-mono">{col.items.length}</span>
            </p>
            <div className="space-y-2">
              {col.items.map(([co, role]) => (
                <div key={co} className={`rounded-card border p-2.5 shadow-card ${col.moss ? 'border-moss/40 bg-moss-s/50' : 'border-rule bg-paper/70'}`}>
                  <p className="text-xs font-semibold text-ink">{co}</p>
                  <p className="text-[11px] text-graphite">{role}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-rule rounded-card border border-rule bg-paper/60 py-3 text-center">
        {[['14', 'applied'], ['43%', 'response'], ['21%', 'interview']].map(([v, l]) => (
          <div key={l}><p className="font-mono text-base font-semibold text-navy">{v}</p><p className="text-[10px] uppercase tracking-wider text-stone">{l}</p></div>
        ))}
      </div>
    </div>
  )
}

function InboxVisual() {
  return (
    <div className="card space-y-3 p-5">
      {[
        { co: 'Stripe', pill: 'pill-navy', type: 'Interview Request', body: 'Final round with the design org — pick a slot before Friday.', due: 'due Jun 13 · 3d' },
        { co: 'Notion', pill: 'pill-moss', type: 'Offer', body: 'Offer letter attached — respond within one week.', due: 'due Jun 17' },
        { co: 'Vercel', pill: 'pill-amber', type: 'Documents Needed', body: 'Portfolio + two references requested by the recruiter.', due: null },
      ].map((m) => (
        <div key={m.co} className="rounded-card border border-rule bg-paper/70 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{m.co}</p>
            <span className={m.pill}>{m.type}</span>
            {m.due && <span className="font-mono text-[10px] text-red-700">{m.due}</span>}
          </div>
          <p className="mt-1.5 text-xs text-graphite">{m.body}</p>
        </div>
      ))}
    </div>
  )
}

const features = [
  {
    id: 'vault', icon: FolderOpen, kicker: 'The Vault', title: 'Write your story once. Reuse it forever.',
    body: 'Nine structured sections hold everything — roles, degrees, projects, awards, publications. Drag to reorder, watch your completeness ring fill, and let AI parse your old resume straight into place. Free, forever.',
    visual: <VaultVisual />,
  },
  {
    id: 'resume', icon: FileText, kicker: 'Resume Generator', title: 'A typeset resume you edit like a document.',
    body: 'Claude reads your vault, picks what matters for the role, and compiles a flawless PDF in your browser. Click any line on the preview to edit it in place — the typesetting engine stays invisible. Four editorial templates included.',
    visual: <ResumeVisual />,
  },
  {
    id: 'tracker', icon: Kanban, kicker: 'Job Tracker', title: 'Your whole pipeline, one calm board.',
    body: 'Seven stages from Saved to Offer. Drag cards as things move, keep notes, contacts and the exact resume version you sent — and watch your response and interview rates compute themselves.',
    visual: <TrackerVisual />,
  },
  {
    id: 'inbox', icon: Mail, kicker: 'Gmail Connector', title: 'Never miss the email that matters.',
    body: 'Connect Gmail and Pressed scans for recruiter threads, classifies each one — interview, offer, rejection, follow-up — extracts the deadline, and lines them up by urgency. One click links any email to its tracker card.',
    visual: <InboxVisual />,
  },
]

function Features() {
  return (
    <section className="px-5 pb-24">
      <div className="mx-auto max-w-6xl space-y-24">
        {features.map((f, i) => (
          <div key={f.id} id={f.id} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal variant={i % 2 ? 'right' : 'left'} className={i % 2 ? 'md:order-2' : ''}>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-navy">
                <f.icon size={14} /> {f.kicker}
              </p>
              <h3 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">{f.title}</h3>
              <p className="mt-4 leading-relaxed text-graphite">{f.body}</p>
            </Reveal>
            <Reveal variant={i % 2 ? 'left' : 'right'} delay={120} className={i % 2 ? 'md:order-1' : ''}>
              {f.visual}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Dark quote                                                         */
/* ================================================================== */

function Quote() {
  return (
    <section className="bg-ink px-5 py-28">
      <Reveal variant="blur" className="mx-auto max-w-4xl text-center">
        <p className="font-display text-3xl italic leading-snug text-cream md:text-[44px]">
          “The search is a hundred small acts of preparation.
          The ones who win aren't lucky — they're <span className="text-navy-s">pressed, polished, and ready</span> before the door opens.”
        </p>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-stone">— the Meridia field notes</p>
      </Reveal>
    </section>
  )
}

/* ================================================================== */
/*  Pricing                                                            */
/* ================================================================== */

const plans = [
  { name: 'Free', price: '$0', cadence: 'forever', cta: 'Start free', plan: null, perks: ['Full Vault, unlimited entries', 'Job tracker, unlimited applications', 'One AI resume parse', 'Two theme presets'] },
  { name: 'Pro Monthly', price: '$15', cadence: 'per month', cta: 'Go Pro', plan: 'pro_monthly', perks: ['Everything in Free', 'AI resume generator + 4 templates', 'Click-to-edit visual editor', 'Tailor-for-role rewrites', 'Gmail connector', 'Version history + all themes'] },
  { name: 'Pro Annual', price: '$120', cadence: 'per year', cta: 'Go Pro · save 33%', plan: 'pro_annual', featured: true, perks: ['Everything in Pro Monthly', 'Two months free', 'Priority AI capacity', 'Early access to new templates'] },
  { name: 'Lifetime', price: '$299', cadence: 'once', cta: 'Own it forever', plan: 'lifetime', perks: ['Everything in Pro, forever', 'Every future feature', 'No renewal, ever', 'A very pressed suit'] },
]

function Pricing() {
  const { session } = useAuth()
  const choose = (plan) => {
    if (!plan) return openAuth('signup')
    if (!session) return openAuth('signup')
    window.dispatchEvent(new CustomEvent('pressed:pro-required'))
  }
  return (
    <section id="pricing" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">Pricing</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            Dress for the job you want.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-graphite">The Vault and tracker are free forever. Pro adds the tailor.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 110} className="h-full">
              <div className={`card card-hover relative flex h-full flex-col p-6 ${p.featured ? '!border-navy shadow-featured' : ''}`}>
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy px-3 py-1 text-[11px] font-medium text-cream">Most popular</span>
                )}
                <p className="text-sm font-medium text-graphite">{p.name}</p>
                <p className="mt-3 font-mono text-4xl font-semibold text-ink">{p.price}</p>
                <p className="mt-1 text-xs text-stone">{p.cadence}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-graphite">
                      <Check size={14} className="mt-0.5 shrink-0 text-moss" /> {perk}
                    </li>
                  ))}
                </ul>
                <button onClick={() => choose(p.plan)} className={`${p.featured ? 'btn-primary' : 'btn-secondary'} mt-6 w-full`}>
                  {p.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Footer                                                             */
/* ================================================================== */

function Footer() {
  return (
    <footer className="border-t border-rule px-5 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="wordmark">Pressed</p>
          <p className="mt-1 text-sm text-stone">Your career, polished. A Meridia product.</p>
        </div>
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-graphite">
          {[['#vault', 'Vault'], ['#resume', 'Resume'], ['#tracker', 'Tracker'], ['#pricing', 'Pricing']].map(([href, label]) => (
            <a key={label} href={href} className="transition-colors duration-300 ease-editorial hover:text-ink">{label}</a>
          ))}
          <Link to="/privacy" className="transition-colors duration-300 ease-editorial hover:text-ink">Privacy</Link>
        </nav>
        <p className="font-mono text-xs text-stone">© {new Date().getFullYear()} Meridia Labs</p>
      </div>
    </footer>
  )
}

export default function Marketing() {
  return (
    <main>
      <Hero />
      <Mockup />
      <HowItWorks />
      <Features />
      <Quote />
      <Pricing />
      <Footer />
    </main>
  )
}
