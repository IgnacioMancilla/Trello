import { useEffect, useState } from 'react';

const COLORS = [
  ['Sin etiqueta', ''], ['Violeta', '#8b5cf6'], ['Azul', '#38bdf8'], ['Verde', '#34d399'], ['Naranja', '#fb923c'], ['Rojo', '#f87171']
];

export default function CardModal({ card, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(card || { title: '', description: '', labelColor: '', dueDate: '' });
  useEffect(() => setForm(card || { title: '', description: '', labelColor: '', dueDate: '' }), [card]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/80 p-4" onMouseDown={onClose}>
      <form onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSave(form); }} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{card?.id ? 'Editar tarjeta' : 'Nueva tarjeta'}</h2><button type="button" onClick={onClose} className="text-slate-400 hover:text-white">×</button></div>
        <label className="block text-sm text-slate-300">Título<input autoFocus required value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 outline-none focus:border-violet-400" /></label>
        <label className="mt-4 block text-sm text-slate-300">Descripción<textarea value={form.description || ''} onChange={(event) => update('description', event.target.value)} rows="4" className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-2.5 outline-none focus:border-violet-400" /></label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-300">Etiqueta<select value={form.labelColor || ''} onChange={(event) => update('labelColor', event.target.value || null)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5"><option value="">Sin etiqueta</option>{COLORS.slice(1).map(([name, color]) => <option key={color} value={color}>{name}</option>)}</select></label>
          <label className="text-sm text-slate-300">Fecha límite<input type="date" value={form.dueDate || ''} onChange={(event) => update('dueDate', event.target.value || null)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5" /></label>
        </div>
        <div className="mt-6 flex items-center justify-between"><div>{card?.id && <button type="button" onClick={() => onDelete(card.id)} className="text-sm text-red-400 hover:text-red-300">Eliminar</button>}</div><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancelar</button><button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400">Guardar</button></div></div>
      </form>
    </div>
  );
}
