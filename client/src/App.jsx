import { useEffect, useState } from 'react';
import { api } from './api.js';
import Column from './components/Column.jsx';
import CardModal from './components/CardModal.jsx';

const moveInBoard = (board, cardId, targetColumnId, beforeId) => {
  const source = board.columns.find((column) => column.cards.some((card) => card.id === cardId));
  const card = source?.cards.find((item) => item.id === cardId);
  if (!card) return board;
  const columns = board.columns.map((column) => ({ ...column, cards: column.cards.filter((item) => item.id !== cardId) }));
  const target = columns.find((column) => column.id === targetColumnId);
  const index = beforeId ? target.cards.findIndex((item) => item.id === beforeId) : target.cards.length;
  target.cards.splice(index < 0 ? target.cards.length : index, 0, { ...card, columnId: targetColumnId });
  return { ...board, columns };
};

export default function App() {
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [newColumn, setNewColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [toast, setToast] = useState('');

  const showError = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3500); };
  const load = () => api('/boards').then((boards) => api(`/boards/${boards[0].id}`)).then(setBoard).catch((error) => showError(error.message));
  useEffect(() => { load(); }, []);
  const mutate = async (action, rollback) => { try { await action(); } catch (error) { if (rollback) setBoard(rollback); showError(error.message); } };

  const createCard = (columnId, title) => mutate(async () => { const card = await api(`/columns/${columnId}/cards`, { method: 'POST', body: JSON.stringify({ title }) }); setBoard((current) => ({ ...current, columns: current.columns.map((column) => column.id === columnId ? { ...column, cards: [...column.cards, card] } : column) })); });
  const saveCard = (form) => {
    if (!selected?.id) return createCard(selected.columnId, form.title).then(() => setSelected(null));
    const previous = board;
    setBoard((current) => ({ ...current, columns: current.columns.map((column) => ({ ...column, cards: column.cards.map((card) => card.id === selected.id ? { ...card, ...form } : card) })) }));
    mutate(() => api(`/cards/${selected.id}`, { method: 'PATCH', body: JSON.stringify(form) }), previous);
    setSelected(null);
  };
  const deleteCard = (id) => { const previous = board; setBoard((current) => ({ ...current, columns: current.columns.map((column) => ({ ...column, cards: column.cards.filter((card) => card.id !== id) })) })); setSelected(null); mutate(() => api(`/cards/${id}`, { method: 'DELETE' }), previous); };
  const moveCard = (event, columnId, beforeId) => {
    event.preventDefault(); const cardId = event.dataTransfer.getData('text/plain') || event.dataTransfer.getData('cardId'); if (!cardId) return;
    const previous = board; const next = moveInBoard(board, cardId, columnId, beforeId); setBoard(next); setDraggingId(null);
    const column = next.columns.find((item) => item.id === columnId); const at = column.cards.findIndex((item) => item.id === cardId);
    mutate(() => api(`/cards/${cardId}/move`, { method: 'PATCH', body: JSON.stringify({ columnId, beforeId: at > 0 ? column.cards[at - 1].id : null, afterId: at < column.cards.length - 1 ? column.cards[at + 1].id : null }) }), previous);
  };
  const moveToColumn = (cardId, targetIndex) => {
    const target = board.columns[targetIndex];
    const previous = board;
    const next = moveInBoard(board, cardId, target.id, null);
    setBoard(next);
    const cards = next.columns[targetIndex].cards;
    const at = cards.findIndex((card) => card.id === cardId);
    mutate(() => api(`/cards/${cardId}/move`, { method: 'PATCH', body: JSON.stringify({ columnId: target.id, beforeId: at > 0 ? cards[at - 1].id : null, afterId: null }) }), previous);
  };
  const renameColumn = (id, title) => mutate(() => api(`/columns/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }));
  const addColumn = async (event) => { event.preventDefault(); if (!columnTitle.trim()) return; try { const column = await api(`/boards/${board.id}/columns`, { method: 'POST', body: JSON.stringify({ title: columnTitle }) }); setBoard((current) => ({ ...current, columns: [...current.columns, column] })); setColumnTitle(''); setNewColumn(false); } catch (error) { showError(error.message); } };

  if (!board) return <main className="p-8"><div className="h-8 w-48 animate-pulse rounded bg-slate-800" /><div className="mt-8 flex gap-4">{[1, 2, 3].map((item) => <div key={item} className="h-72 w-80 animate-pulse rounded-2xl bg-slate-900" />)}</div></main>;
  return <main className="min-h-screen p-5 md:p-8"><header className="mb-8 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Kanban MVP</p><h1 className="mt-1 text-2xl font-bold">{board.title}</h1></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">Copia Trello</span></header><div className="flex gap-4 overflow-x-auto pb-6">{board.columns.map((column, index) => <Column key={column.id} column={column} columnIndex={index} columnCount={board.columns.length} draggingId={draggingId} onCreateCard={createCard} onEditCard={setSelected} onRename={renameColumn} onDragStart={(event, id) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); event.dataTransfer.setData('cardId', id); setDraggingId(id); }} onDragEnd={() => setDraggingId(null)} onDropCard={moveCard} onMoveCard={moveToColumn} />)}{newColumn ? <form onSubmit={addColumn} className="h-fit w-80 shrink-0 rounded-2xl bg-slate-900 p-3"><input autoFocus value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} placeholder="Nombre de la columna" className="w-full rounded-lg bg-slate-800 p-2 text-sm outline-none" /><div className="mt-2 flex gap-2"><button className="rounded-lg bg-violet-500 px-3 py-2 text-sm">Añadir</button><button type="button" onClick={() => setNewColumn(false)} className="px-3 text-sm text-slate-400">Cancelar</button></div></form> : <button onClick={() => setNewColumn(true)} className="h-fit w-44 shrink-0 rounded-xl border border-dashed border-slate-700 px-4 py-3 text-left text-sm text-slate-400 hover:border-violet-400 hover:text-violet-300">+ Añadir columna</button>}</div>{selected && <CardModal card={selected} onClose={() => setSelected(null)} onSave={saveCard} onDelete={deleteCard} />}{toast && <div className="fixed bottom-5 right-5 rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-200 shadow-lg">{toast}</div>}</main>;
}
