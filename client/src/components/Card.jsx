export default function Card({ card, onEdit, onDragStart, onDragEnd, onMoveLeft, onMoveRight }) {
  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, card.id)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(card)}
      className="group cursor-grab rounded-xl border border-slate-700/70 bg-slate-800 p-3 shadow-sm transition hover:border-slate-500 hover:bg-slate-750 active:cursor-grabbing"
    >
      {card.labelColor && <span className="mb-2 block h-1.5 w-10 rounded-full" style={{ backgroundColor: card.labelColor }} />}
      <p className="text-sm font-medium text-slate-100">{card.title}</p>
      <div className="mt-3 flex items-center justify-between">
        {card.dueDate ? <p className="text-xs text-slate-400">Vence: {new Date(`${card.dueDate}T12:00:00`).toLocaleDateString()}</p> : <span />}
        <div className="flex gap-1 transition md:opacity-0 md:group-hover:opacity-100">
          <button type="button" title="Mover a la columna anterior" aria-label="Mover a la columna anterior" disabled={!onMoveLeft} onClick={(event) => { event.stopPropagation(); onMoveLeft?.(); }} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">←</button>
          <button type="button" title="Mover a la siguiente columna" aria-label="Mover a la siguiente columna" disabled={!onMoveRight} onClick={(event) => { event.stopPropagation(); onMoveRight?.(); }} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">→</button>
        </div>
      </div>
    </article>
  );
}
