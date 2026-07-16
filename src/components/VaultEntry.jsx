import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function VaultEntry({ entry, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const dateRange = [entry.start_date, entry.current ? 'Present' : entry.end_date].filter(Boolean).join(' — ')

  return (
    <div ref={setNodeRef} style={style} className="card card-hover group p-5">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab text-stone opacity-0 transition-opacity duration-300 group-hover:opacity-100 active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate font-medium text-ink">{entry.title || 'Untitled'}</h3>
            {dateRange && <span className="shrink-0 font-mono text-xs text-stone">{dateRange}</span>}
          </div>
          {(entry.organization || entry.location) && (
            <p className="mt-0.5 text-sm text-graphite">
              {[entry.organization, entry.location].filter(Boolean).join(' · ')}
            </p>
          )}
          {entry.description && <p className="mt-2 line-clamp-2 text-sm text-graphite">{entry.description}</p>}
          {Array.isArray(entry.bullets) && entry.bullets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {entry.bullets.slice(0, 3).map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-graphite">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                  <span className="line-clamp-1">{b}</span>
                </li>
              ))}
              {entry.bullets.length > 3 && <li className="text-xs text-stone">+{entry.bullets.length - 3} more</li>}
            </ul>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button onClick={() => onEdit(entry)} className="btn-ghost !p-2" title="Edit"><Pencil size={14} /></button>
          <button onClick={() => onDelete(entry)} className="btn-ghost !p-2 hover:!bg-red-50 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )
}
