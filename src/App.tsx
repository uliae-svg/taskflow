/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, CheckCircle, CircleDashed, Mic, MicOff, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Priority = 'low' | 'medium' | 'high';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  color: string;
}

type FilterType = 'all' | 'active' | 'completed';

const COLORS = [
  { id: 'slate',   bg: 'bg-slate-500',   hex: '#475569' },
  { id: 'indigo',  bg: 'bg-indigo-600',  hex: '#4338CA' },
  { id: 'rose',    bg: 'bg-rose-600',    hex: '#E11D48' },
  { id: 'amber',   bg: 'bg-amber-500',   hex: '#D97706' },
  { id: 'emerald', bg: 'bg-emerald-600', hex: '#059669' },
];

const PRIORITIES: { id: Priority; label: string; hex: string }[] = [
  { id: 'low',    label: 'НИЗКИЙ',  hex: '#0A0A0A' },
  { id: 'medium', label: 'СРЕДНИЙ', hex: '#D97706' },
  { id: 'high',   label: 'ВЫСОКИЙ', hex: '#FF1F1F' },
];

const FILTER_LABELS: Record<FilterType, string> = {
  all:       'ВСЕ',
  active:    'АКТИВНЫЕ',
  completed: 'ВЫПОЛНЕННЫЕ',
};

const OSW  = "'Oswald', Impact, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('taskflow_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue]             = useState('');
  const [filter, setFilter]                     = useState<FilterType>('all');
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [editValue, setEditValue]               = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedColor, setSelectedColor]       = useState('indigo');
  const [isListening, setIsListening]           = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('taskflow_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    setTodos(prev => [{
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
      priority: selectedPriority,
      color: selectedColor,
    }, ...prev]);
    setInputValue('');
  };

  const toggleTodo        = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo        = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));
  const startEditing      = (id: string, text: string) => { setEditingId(id); setEditValue(text); };
  const saveEdit          = (id: string) => {
    if (!editValue.trim()) { deleteTodo(id); } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, text: editValue.trim() } : t));
    }
    setEditingId(null);
  };
  const updateTodoProperty = (id: string, updates: Partial<Todo>) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const cancelEdit        = () => setEditingId(null);
  const clearCompleted    = () => setTodos(prev => prev.filter(t => !t.completed));

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.lang = 'ru-RU'; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => {
      setInputValue(prev => prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript);
      setIsListening(false);
    };
    r.onerror = r.onend = () => setIsListening(false);
    recognitionRef.current = r; r.start(); setIsListening(true);
  };

  const filteredTodos = useMemo(() => {
    if (filter === 'active')    return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t =>  t.completed);
    return todos;
  }, [todos, filter]);

  const stats = useMemo(() => {
    const completed = todos.filter(t => t.completed).length;
    return { total: todos.length, completed, active: todos.length - completed };
  }, [todos]);

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const BORDER = '2px solid #0A0A0A';

  return (
    <div style={{ fontFamily: MONO, background: '#FFFFFF', color: '#0A0A0A', minHeight: '100vh' }}>
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'clamp(24px,5vw,60px) 20px' }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header style={{ marginBottom: '48px' }}>
          {/* Top rule — thick red */}
          <div style={{ height: '6px', background: '#FF1F1F', marginBottom: '20px' }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <h1 style={{
              fontFamily: OSW, fontWeight: 700, textTransform: 'uppercase',
              fontSize: 'clamp(52px, 14vw, 88px)', lineHeight: 0.88,
              letterSpacing: '-0.02em', color: '#0A0A0A',
            }}>
              Task<br />Flow
            </h1>

            <div style={{ border: BORDER, padding: '12px 18px', textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: OSW, fontWeight: 700, fontSize: '9px', letterSpacing: '0.25em', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                ВЫПОЛНЕНО
              </p>
              <p style={{ fontFamily: OSW, fontWeight: 700, fontSize: '36px', lineHeight: 1, color: '#0A0A0A' }}>
                {stats.completed}<span style={{ color: '#CCC', margin: '0 4px' }}>/</span>{stats.total}
              </p>
            </div>
          </div>

          {/* Progress bar — black border, red fill */}
          <div style={{ border: BORDER, height: '20px', background: '#F5F5F5' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              style={{ height: '100%', background: '#FF1F1F' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase' }}>
              ПРОГРЕСС
            </span>
            <AnimatePresence>
              {progress === 100 && stats.total > 0 && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', color: '#FF1F1F', textTransform: 'uppercase' }}
                >
                  ✓ ВСЕ ВЫПОЛНЕНО
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── INPUT AREA ─────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ border: BORDER, borderBottom: 'none' }}>
            <form onSubmit={addTodo} style={{ display: 'flex', borderBottom: BORDER }}>
              <input
                type="text" value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="_ НОВАЯ ЗАДАЧА"
                style={{ flex: 1, minWidth: 0, fontFamily: MONO, fontWeight: 500, fontSize: '15px', background: 'transparent', border: 'none', outline: 'none', color: '#0A0A0A', padding: '14px 16px', letterSpacing: '0.02em' }}
              />
              <button type="button" onClick={toggleListening}
                style={{ flexShrink: 0, padding: '0 14px', borderLeft: BORDER, background: isListening ? '#FF1F1F' : 'transparent', color: isListening ? '#FFF' : '#999', border: 'none', borderLeft: BORDER, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button type="submit" disabled={!inputValue.trim()}
                style={{ flexShrink: 0, padding: '0 20px', background: inputValue.trim() ? '#0A0A0A' : '#F0F0F0', color: inputValue.trim() ? '#FFFFFF' : '#BBB', border: 'none', borderLeft: BORDER, cursor: 'pointer', fontFamily: OSW, fontWeight: 700, fontSize: '20px', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                className="active:scale-95"
              >
                <Plus size={20} />
              </button>
            </form>

            {/* Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0', borderBottom: BORDER }}>
              {PRIORITIES.map((p, i) => (
                <button key={p.id} onClick={() => setSelectedPriority(p.id)}
                  style={{
                    fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.15em',
                    padding: '10px 14px', border: 'none',
                    borderRight: i < PRIORITIES.length - 1 ? BORDER : 'none',
                    background: selectedPriority === p.id ? p.hex : 'transparent',
                    color: selectedPriority === p.id ? (p.id === 'low' ? '#FFF' : '#FFF') : '#888',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
              <div style={{ width: '1px', background: '#0A0A0A', alignSelf: 'stretch' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
                {COLORS.map(c => (
                  <button key={c.id} onClick={() => setSelectedColor(c.id)}
                    style={{
                      width: '16px', height: '16px', background: c.hex, border: selectedColor === c.id ? `3px solid #0A0A0A` : '2px solid transparent',
                      outline: selectedColor === c.id ? `2px solid ${c.hex}` : 'none',
                      outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.15s',
                      opacity: selectedColor === c.id ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', border: BORDER }}>
            {(['all', 'active', 'completed'] as FilterType[]).map((f, i) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.15em',
                  padding: '8px 14px', border: 'none',
                  borderLeft: i > 0 ? BORDER : 'none',
                  background: filter === f ? '#0A0A0A' : '#FFFFFF',
                  color: filter === f ? '#FFFFFF' : '#0A0A0A',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AnimatePresence>
              {stats.completed > 0 && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={clearCompleted}
                  style={{ fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.15em', color: '#FF1F1F', background: 'transparent', border: '2px solid #FF1F1F', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}
                  className="hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                >
                  <Trash2 size={10} /> ОЧИСТИТЬ
                </motion.button>
              )}
            </AnimatePresence>
            <span className="hidden sm:block" style={{ fontFamily: OSW, fontWeight: 700, fontSize: '10px', letterSpacing: '0.15em', color: '#888' }}>
              {filteredTodos.length} ЗАДАЧ
            </span>
          </div>
        </div>

        {/* ── TODO LIST ──────────────────────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={filter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <AnimatePresence initial={false}>
              {filteredTodos.length > 0 ? filteredTodos.map(todo => {
                const pc = PRIORITIES.find(p => p.id === todo.priority)!;
                const cc = COLORS.find(c => c.id === todo.color)!;
                return (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
                    className="group"
                    style={{
                      border: BORDER,
                      borderLeft: `6px solid ${todo.completed ? '#DDD' : cc.hex}`,
                      background: todo.completed ? '#FAFAFA' : '#FFFFFF',
                      marginBottom: '8px',
                      opacity: todo.completed ? 0.65 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' }}>

                      {/* Checkbox */}
                      <button onClick={() => toggleTodo(todo.id)}
                        style={{ flexShrink: 0, marginTop: '2px', border: 'none', background: 'transparent', cursor: 'pointer', color: todo.completed ? '#FF1F1F' : '#CCC', transition: 'color 0.15s' }}
                        className="hover:text-red-500"
                      >
                        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>

                      {/* Content */}
                      {editingId === todo.id ? (
                        <div style={{ flexGrow: 1 }}>
                          <input autoFocus type="text" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(todo.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') cancelEdit(); }}
                            style={{ width: '100%', fontFamily: MONO, fontWeight: 500, fontSize: '15px', background: 'transparent', border: 'none', borderBottom: '2px solid #FF1F1F', outline: 'none', color: '#0A0A0A', paddingBottom: '4px', marginBottom: '10px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', border: BORDER }}>
                              {PRIORITIES.map((p, i) => (
                                <button key={p.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { priority: p.id }); }}
                                  style={{ fontFamily: OSW, fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', padding: '5px 10px', border: 'none', borderLeft: i > 0 ? BORDER : 'none', background: todo.priority === p.id ? p.hex : 'transparent', color: todo.priority === p.id ? '#FFF' : '#888', cursor: 'pointer' }}
                                >{p.label}</button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {COLORS.map(c => (
                                <button key={c.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { color: c.id }); }}
                                  style={{ width: '14px', height: '14px', background: c.hex, border: todo.color === c.id ? '2px solid #0A0A0A' : '2px solid transparent', cursor: 'pointer', opacity: todo.color === c.id ? 1 : 0.35 }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontFamily: OSW, fontWeight: 700, fontSize: '9px', letterSpacing: '0.25em', color: pc.hex, textTransform: 'uppercase', marginBottom: '4px' }}>
                            {pc.label}
                          </span>
                          <p
                            onDoubleClick={() => !todo.completed && startEditing(todo.id, todo.text)}
                            style={{ fontFamily: MONO, fontWeight: todo.completed ? 400 : 500, fontSize: '15px', lineHeight: 1.5, color: todo.completed ? '#AAA' : '#0A0A0A', textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'text', margin: 0, wordBreak: 'break-word' }}
                          >
                            {todo.text}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginTop: '1px' }}>
                        {!todo.completed && editingId !== todo.id && (
                          <button onClick={() => startEditing(todo.id, todo.text)}
                            style={{ padding: '6px', background: 'transparent', border: 'none', color: '#CCC', cursor: 'pointer', transition: 'color 0.15s' }}
                            className="hover:!text-black"
                            aria-label="Редактировать"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteTodo(todo.id)}
                          style={{ padding: '6px', background: 'transparent', border: 'none', color: '#CCC', cursor: 'pointer', transition: 'color 0.15s' }}
                          className="hover:!text-red-600"
                          aria-label="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '60px 0', textAlign: 'center', border: BORDER }}>
                  <div style={{ color: '#DDD', marginBottom: '16px' }}>
                    {filter === 'completed' ? <CheckCircle   size={36} style={{ margin: '0 auto' }} />
                      : filter === 'active'  ? <CircleDashed size={36} style={{ margin: '0 auto' }} />
                      : <ListTodo            size={36} style={{ margin: '0 auto' }} />}
                  </div>
                  <p style={{ fontFamily: OSW, fontWeight: 700, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#BBB' }}>
                    {filter === 'all' ? '— СПИСОК ПУСТ —'
                      : filter === 'active' ? '— ВСЕ ВЫПОЛНЕНО —'
                      : '— НЕТ ВЫПОЛНЕННЫХ —'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        {todos.length > 0 && (
          <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #0A0A0A', display: 'flex', justifyContent: 'center', gap: '40px' }}>
            <span style={{ fontFamily: OSW, fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: '#0A0A0A', display: 'inline-block' }} />
              {stats.active} АКТИВНО
            </span>
            <span style={{ fontFamily: OSW, fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', color: '#FF1F1F', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: '#FF1F1F', display: 'inline-block' }} />
              {stats.completed} ВЫПОЛНЕНО
            </span>
          </footer>
        )}

      </div>
    </div>
  );
}
