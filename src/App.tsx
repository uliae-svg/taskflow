/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent, CSSProperties } from 'react';
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
  { id: 'slate',   bg: 'bg-slate-500',   hex: '#5C6B7A' },
  { id: 'indigo',  bg: 'bg-indigo-700',  hex: '#2D3A8C' },
  { id: 'rose',    bg: 'bg-rose-700',    hex: '#C11C3B' },
  { id: 'amber',   bg: 'bg-amber-700',   hex: '#9B6000' },
  { id: 'emerald', bg: 'bg-emerald-700', hex: '#0A6B45' },
];

const PRIORITIES: { id: Priority; label: string; hex: string }[] = [
  { id: 'low',    label: 'НИЗКИЙ',  hex: '#AAAAAA' },
  { id: 'medium', label: 'СРЕДНИЙ', hex: '#555555' },
  { id: 'high',   label: 'ВЫСОКИЙ', hex: '#E8001C' },
];

const FILTER_LABELS: Record<FilterType, string> = {
  all:       'ВСЕ',
  active:    'АКТИВНЫЕ',
  completed: 'ВЫПОЛНЕННЫЕ',
};

const BAR = "'Barlow Condensed', Impact, sans-serif";
const MAN = "'Manrope', Helvetica, sans-serif";

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

  const label = (_text: string): CSSProperties => ({
    fontFamily: BAR, fontWeight: 400, fontSize: '9px',
    letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: '#AAAAAA',
  });

  return (
    <div style={{ fontFamily: MAN, background: '#F8F8F6', color: '#111111', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(28px,6vw,72px) 24px' }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header style={{ marginBottom: '56px' }}>

          <p style={{ ...label(''), marginBottom: '14px' }}>
            СПИСОК ЗАДАЧ — {new Date().getFullYear()}
          </p>

          {/* Title + Counter — mirrored typographic composition */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
            <h1 style={{
              fontFamily: BAR, fontWeight: 700, textTransform: 'uppercase',
              fontSize: 'clamp(56px, 13vw, 86px)', lineHeight: 0.87,
              letterSpacing: '-0.015em', color: '#111111',
            }}>
              TASK<br />FLOW
            </h1>
            <div style={{ textAlign: 'right', flexShrink: 0, paddingBottom: '4px' }}>
              <span style={{
                fontFamily: BAR, fontWeight: 700, display: 'block',
                fontSize: 'clamp(56px, 13vw, 86px)', lineHeight: 0.87,
                color: '#E8001C',
              }}>
                {stats.completed}
              </span>
              <span style={{ ...label(''), color: '#BBBBBB', display: 'block', marginTop: '8px' }}>
                / {stats.total} ЗАДАЧ
              </span>
            </div>
          </div>

          {/* Progress rule */}
          <div style={{ position: 'relative' }}>
            <div style={{ height: '1px', background: '#DEDEDE' }} />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              style={{ position: 'absolute', top: '-1px', left: 0, height: '3px', background: '#E8001C' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={label('')}>ПРОГРЕСС</span>
            <AnimatePresence>
              {progress === 100 && stats.total > 0 ? (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ ...label(''), color: '#E8001C' }}
                >
                  ✓ ВСЕ ВЫПОЛНЕНО
                </motion.span>
              ) : (
                <span style={{ ...label(''), color: progress > 0 ? '#E8001C' : '#CCCCCC' }}>
                  {Math.round(progress)}%
                </span>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── INPUT AREA ─────────────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label(''), marginBottom: '10px' }}>НОВАЯ ЗАДАЧА</p>

          <form onSubmit={addTodo} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '2px solid #111111', marginBottom: '16px' }}>
            <input
              type="text" value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Введите задачу..."
              style={{ flex: 1, minWidth: 0, fontFamily: MAN, fontWeight: 400, fontSize: '16px', background: 'transparent', border: 'none', outline: 'none', color: '#111111', padding: '12px 0', letterSpacing: '0.01em' }}
              className="placeholder:text-[#CCCCCC]"
            />
            <button type="button" onClick={toggleListening}
              style={{ flexShrink: 0, padding: '0 14px', background: 'transparent', border: 'none', borderLeft: '1px solid #E0E0E0', color: isListening ? '#E8001C' : '#CCCCCC', cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
              className={isListening ? 'animate-pulse' : ''}
              aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button type="submit" disabled={!inputValue.trim()}
              style={{ flexShrink: 0, padding: '0 22px', background: inputValue.trim() ? '#111111' : '#E8E8E8', color: inputValue.trim() ? '#FFFFFF' : '#AAAAAA', border: 'none', borderLeft: '2px solid #111111', cursor: 'pointer', fontFamily: BAR, fontWeight: 700, letterSpacing: '0.1em', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
              className="active:scale-95"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              {PRIORITIES.map(p => (
                <button key={p.id} onClick={() => setSelectedPriority(p.id)}
                  style={{
                    fontFamily: BAR, fontWeight: 600, fontSize: '10px', letterSpacing: '0.25em',
                    textTransform: 'uppercase', background: 'transparent', border: 'none',
                    borderBottom: selectedPriority === p.id ? `2px solid ${p.hex}` : '2px solid transparent',
                    color: selectedPriority === p.id ? p.hex : '#BBBBBB',
                    padding: '4px 0', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{p.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {COLORS.map(c => (
                <button key={c.id} onClick={() => setSelectedColor(c.id)}
                  style={{
                    width: '14px', height: '14px', background: c.hex,
                    border: selectedColor === c.id ? '2px solid #111111' : '2px solid transparent',
                    outline: selectedColor === c.id ? `2px solid ${c.hex}55` : 'none',
                    outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.15s',
                    opacity: selectedColor === c.id ? 1 : 0.35,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', paddingBottom: '16px', borderBottom: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            {(['all', 'active', 'completed'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  fontFamily: BAR, fontWeight: 600, fontSize: '10px', letterSpacing: '0.25em',
                  textTransform: 'uppercase', background: 'transparent', border: 'none',
                  borderBottom: filter === f ? '2px solid #E8001C' : '2px solid transparent',
                  color: filter === f ? '#E8001C' : '#AAAAAA',
                  padding: '4px 0', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{FILTER_LABELS[f]}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <AnimatePresence>
              {stats.completed > 0 && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={clearCompleted}
                  style={{ fontFamily: BAR, fontWeight: 600, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#E8001C', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                  className="hover:opacity-60 transition-opacity"
                >
                  <Trash2 size={10} /> ОЧИСТИТЬ
                </motion.button>
              )}
            </AnimatePresence>
            <span className="hidden sm:block" style={{ ...label(''), color: '#CCCCCC' }}>
              {filteredTodos.length} ЕД.
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
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="group"
                    style={{
                      position: 'relative',
                      borderBottom: '1px solid #EBEBEB',
                      opacity: todo.completed ? 0.55 : 1,
                    }}
                  >
                    {/* Left color strip */}
                    {!todo.completed && (
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: cc.hex }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 0 16px 16px' }}>

                      {/* Checkbox */}
                      <button onClick={() => toggleTodo(todo.id)}
                        style={{ flexShrink: 0, marginTop: '1px', background: 'transparent', border: 'none', cursor: 'pointer', color: todo.completed ? '#E8001C' : '#DDDDDD', transition: 'color 0.15s', padding: 0 }}
                        className="hover:text-red-600"
                      >
                        {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>

                      {/* Content */}
                      {editingId === todo.id ? (
                        <div style={{ flexGrow: 1 }}>
                          <input autoFocus type="text" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(todo.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') cancelEdit(); }}
                            style={{ width: '100%', fontFamily: MAN, fontWeight: 400, fontSize: '15px', background: 'transparent', border: 'none', borderBottom: '2px solid #E8001C', outline: 'none', color: '#111111', paddingBottom: '4px', marginBottom: '12px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              {PRIORITIES.map(p => (
                                <button key={p.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { priority: p.id }); }}
                                  style={{ fontFamily: BAR, fontWeight: 600, fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', background: 'transparent', border: 'none', borderBottom: todo.priority === p.id ? `2px solid ${p.hex}` : '2px solid transparent', color: todo.priority === p.id ? p.hex : '#CCCCCC', padding: '3px 0', cursor: 'pointer' }}
                                >{p.label}</button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {COLORS.map(c => (
                                <button key={c.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { color: c.id }); }}
                                  style={{ width: '12px', height: '12px', background: c.hex, border: todo.color === c.id ? '2px solid #111' : '2px solid transparent', cursor: 'pointer', opacity: todo.color === c.id ? 1 : 0.3 }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontFamily: BAR, fontWeight: 600, fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: pc.hex, marginBottom: '3px' }}>
                            {pc.label}
                          </span>
                          <p
                            onDoubleClick={() => !todo.completed && startEditing(todo.id, todo.text)}
                            style={{ fontFamily: MAN, fontWeight: 400, fontSize: '15px', lineHeight: 1.55, color: todo.completed ? '#BBBBBB' : '#111111', textDecoration: todo.completed ? 'line-through' : 'none', textDecorationColor: '#CCCCCC', cursor: 'text', margin: 0, wordBreak: 'break-word' }}
                          >
                            {todo.text}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginTop: '1px' }}>
                        {!todo.completed && editingId !== todo.id && (
                          <button onClick={() => startEditing(todo.id, todo.text)}
                            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#CCCCCC', cursor: 'pointer', transition: 'color 0.15s' }}
                            className="hover:!text-black"
                            aria-label="Редактировать"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        <button onClick={() => deleteTodo(todo.id)}
                          style={{ padding: '4px', background: 'transparent', border: 'none', color: '#CCCCCC', cursor: 'pointer', transition: 'color 0.15s' }}
                          className="hover:!text-red-600"
                          aria-label="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '64px 0', textAlign: 'center', borderBottom: '1px solid #EBEBEB' }}>
                  <div style={{ color: '#E0E0E0', marginBottom: '20px' }}>
                    {filter === 'completed' ? <CheckCircle   size={32} style={{ margin: '0 auto' }} />
                      : filter === 'active'  ? <CircleDashed size={32} style={{ margin: '0 auto' }} />
                      : <ListTodo            size={32} style={{ margin: '0 auto' }} />}
                  </div>
                  <p style={{ ...label(''), color: '#CCCCCC', fontSize: '10px' }}>
                    {filter === 'all'      ? '— СПИСОК ПУСТ —'
                      : filter === 'active'  ? '— НЕТ АКТИВНЫХ —'
                      : '— НЕТ ВЫПОЛНЕННЫХ —'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        {todos.length > 0 && (
          <footer style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'center', gap: '48px' }}>
            <span style={{ fontFamily: BAR, fontWeight: 600, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#888888', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', background: '#111111', display: 'inline-block' }} />
              {stats.active} АКТИВНО
            </span>
            <span style={{ fontFamily: BAR, fontWeight: 600, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#E8001C', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', background: '#E8001C', display: 'inline-block' }} />
              {stats.completed} ВЫПОЛНЕНО
            </span>
          </footer>
        )}

      </div>
    </div>
  );
}
