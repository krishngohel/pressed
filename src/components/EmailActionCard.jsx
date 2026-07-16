import { ExternalLink, Link2, X, CalendarClock } from 'lucide-react'

const TYPE_META = {
  interview_invite: { label: 'Interview Request', pill: 'pill-navy' },
  rejection:        { label: 'Rejection',         pill: 'pill-red' },
  offer:            { label: 'Offer',             pill: 'pill-moss' },
  follow_up:        { label: 'Follow Up',         pill: 'pill-amber' },
  documents_needed: { label: 'Documents Needed',  pill: 'pill-amber' },
  other:            { label: 'Update',            pill: 'pill-neutral' },
}

function deadlineLabel(deadline) {
  if (!deadline) return null
  const d = new Date(deadline)
  const days = Math.ceil((d - Date.now()) / 86400000)
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (days < 0) return { text: `was due ${dateStr}`, urgent: true }
  if (days === 0) return { text: 'due today', urgent: true }
  if (days <= 3) return { text: `due ${dateStr} · ${days}d`, urgent: true }
  return { text: `due ${dateStr}`, urgent: false }
}

export default function EmailActionCard({ action, onLink, onDismiss }) {
  const meta = TYPE_META[action.action_type] || TYPE_META.other
  const due = deadlineLabel(action.deadline)

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-ink">{action.company || 'Unknown company'}</h4>
            <span className={meta.pill}>{meta.label}</span>
            {due && (
              <span className={`flex items-center gap-1 font-mono text-xs ${due.urgent ? 'text-red-700' : 'text-stone'}`}>
                <CalendarClock size={12} /> {due.text}
              </span>
            )}
          </div>
          {action.role && <p className="mt-0.5 text-sm text-graphite">{action.role}</p>}
          {action.summary && <p className="mt-2 text-sm text-graphite">{action.summary}</p>}
        </div>
        <button onClick={() => onDismiss(action)} className="btn-ghost !p-1.5 text-stone" title="Dismiss"><X size={14} /></button>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-rule pt-3.5">
        {action.gmail_thread_id && (
          <a
            href={`https://mail.google.com/mail/u/0/#all/${action.gmail_thread_id}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost !px-3 !py-1.5 text-xs"
          >
            <ExternalLink size={13} /> View in Gmail
          </a>
        )}
        <button onClick={() => onLink(action)} className="btn-secondary !px-3 !py-1.5 text-xs">
          <Link2 size={13} /> {action.job_id ? 'Linked to tracker' : 'Link to tracker'}
        </button>
      </div>
    </div>
  )
}
