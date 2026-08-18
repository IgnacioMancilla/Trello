import { useState } from 'react';
import Card from './Card.jsx';

export default function Column({ column, columnIndex, columnCount, onCreateCard, onEditCard, onRename, onDragStart, onDragEnd, onDropCard, onMoveCard, draggingId }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [cardTitle, setCardTitle] = useState('');
  const submitName = (event) => { event.preventDefault(); if (title.trim() && title !== column.title) onRename(column.id, title); };
  const submitCard = (event) => { event.preventDefault(); if (cardTitle.trim()) { onCreateCard(column.id, cardTitle); setCardTitle(''); setAdding(false); } };

  return (
    <section className="flex max-h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-2xl bg-slate-900/80 p-3 ring-1 ring-slate-800">
      <form onSubmit={submitName} className="mb-3"><input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={submitName} className="w-full rounded-lg bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-slate-800 focus:bg-slate-800" /></form>
      <div className="min-h-16 space-y-2 overflow-y-auto rounded-xl pr-1 transition" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => onDropCard(event, column.id, null)}>
        {column.cards.map((card) => <div key={card.id} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => { event.stopPropagation(); onDropCard(event, column.id, card.id); }} className={draggingId === card.id ? 'opacity-30' : ''}><Card card={card} onEdit={onEditCard} onDragStart={onDragStart} onDragEnd={onDragEnd} onMoveLeft={columnIndex > 0 ? () => onMoveCard(card.id, columnIndex - 1) : null} onMoveRight={columnIndex < columnCount - 1 ? () => onMoveCard(card.id, columnIndex + 1) : null} /></div>)}
      </div>
      {adding ? <form onSubmit={submitCard} className="mt-3"><input autoFocus value={cardTitle} onChange={(event) => setCardTitle(event.target.value)} onBlur={() => !cardTitle && setAdding(false)} placeholder="Título de la tarjeta" className="w-full rounded-lg bg-slate-800 p-2 text-sm outline-none ring-violet-400 focus:ring-1" /></form> : <button onClick={() => setAdding(true)} className="mt-3 rounded-lg px-2 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">+ Añadir tarjeta</button>}
    </section>
  );
}
