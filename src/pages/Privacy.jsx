import Reveal from '../components/Reveal'

const sections = [
  ['What we store', 'Your vault entries, resumes, job applications and account details live in our database (Supabase PostgreSQL), scoped to your account and protected by row-level security. We store only what you put in.'],
  ['Gmail access', 'If you connect Gmail, we request read-only access and scan only for job-related threads. OAuth tokens are stored encrypted (AES-256-GCM) — never in plaintext. Disconnecting deletes the tokens immediately.'],
  ['AI processing', 'Resume generation and email parsing send relevant data to Anthropic’s Claude API to produce results. We don’t use your data to train models, and prompt caching is ephemeral.'],
  ['Payments', 'Billing is handled entirely by Stripe. We never see or store your card number — only your subscription status.'],
  ['Your controls', 'Export your entire vault as JSON any time. Deleting your account removes your profile and all associated rows via cascading deletes.'],
  ['Contact', 'Questions? Write to privacy@meridia.app and a human will answer.'],
]

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">Pressed by Meridia</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">Privacy</h1>
        <p className="mt-4 text-graphite">Plain language, because that's how we'd want it explained to us.</p>
      </Reveal>
      <div className="mt-12 space-y-10">
        {sections.map(([title, body], i) => (
          <Reveal key={title} delay={i * 60}>
            <h2 className="font-display text-2xl text-ink">{title}</h2>
            <p className="mt-2.5 leading-relaxed text-graphite">{body}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-16 border-t border-rule pt-6 font-mono text-xs text-stone">Last updated June 2026</p>
    </main>
  )
}
