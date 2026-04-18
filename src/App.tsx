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
  { id: 'slate',   bg: 'bg-slate-400',   hex: '#94A3B8', glow: 'rgba(148,163,184,0.45)' },
  { id: 'indigo',  bg: 'bg-violet-400',  hex: '#A78BFA', glow: 'rgba(167,139,250,0.45)' },
  { id: 'rose',    bg: 'bg-pink-400',    hex: '#F472B6', glow: 'rgba(244,114,182,0.45)' },
  { id: 'amber',   bg: 'bg-amber-400',   hex: '#FBBF24', glow: 'rgba(251,191,36,0.45)'  },
  { id: 'emerald', bg: 'bg-emerald-400', hex: '#34D399', glow: 'rgba(52,211,153,0.45)'  },
];

const PRIORITIES: { id: Priority; label: string; hex: string; pillBg: string }[] = [
  { id: 'low',    label: 'Низкий',  hex: '#10B981', pillBg: 'rgba(16,185,129,0.12)'  },
  { id: 'medium', label: 'Средний', hex: '#F59E0B', pillBg: 'rgba(245,158,11,0.12)'  },
  { id: 'high',   label: 'Высокий', hex: '#EC4899', pillBg: 'rgba(236,72,153,0.12)'  },
];

const FILTER_LABELS: Record<FilterType, string> = {
  all:       'Все',
  active:    'Активные',
  completed: 'Выполненные',
};

const NU = "'Nunito', system-ui, sans-serif";
const CO = "'Comfortaa', cursive";

const glass = (shadow = ''): CSSProperties => ({
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1.5px solid rgba(255,255,255,0.9)',
  borderRadius: '20px',
  boxShadow: shadow || '0 4px 24px rgba(168,85,247,0.08)',
});

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('taskflow_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue]         = useState('');
  const [filter, setFilter]                 = useState<FilterType>('all');
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editValue, setEditValue]           = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedColor, setSelectedColor]   = useState('indigo');
  const [isListening, setIsListening]       = useState(false);
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

  const toggleTodo = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTodo = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));

  const startEditing = (id: string, text: string) => { setEditingId(id); setEditValue(text); };

  const saveEdit = (id: string) => {
    if (!editValue.trim()) {
      deleteTodo(id);
    } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, text: editValue.trim() } : t));
    }
    setEditingId(null);
  };

  const updateTodoProperty = (id: string, updates: Partial<Todo>) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

  const cancelEdit = () => setEditingId(null);
  const clearCompleted = () => setTodos(prev => prev.filter(t => !t.completed));

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
    recognitionRef.current = r;
    r.start(); setIsListening(true);
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

  return (
    <div className="min-h-screen" style={{ fontFamily: NU, color: '#2D1B69' }}>
      <div className="max-w-2xl mx-auto px-5 py-8 md:py-16">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p style={{ fontFamily: NU, fontWeight: 700, color: '#C4B5FD', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✦ мои задачи
              </p>
              <h1 style={{
                fontFamily: CO, fontWeight: 700,
                background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 55%, #F97316 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontSize: 'clamp(40px, 10vw, 64px)', lineHeight: 1.1,
              }}>
                TaskFlow
              </h1>
            </div>

            <div style={{ ...glass('0 4px 20px rgba(168,85,247,0.14)'), padding: '14px 20px', textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontWeight: 700, color: '#C4B5FD', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>прогресс</p>
              <p style={{ fontFamily: CO, fontWeight: 700, color: '#A855F7', fontSize: '30px', lineHeight: 1 }}>
                {stats.completed}<span style={{ color: '#DDD6FE', margin: '0 2px' }}>/</span>{stats.total}
              </p>
            </div>
          </div>

          {/* Gradient progress bar */}
          <div style={{ height: '10px', background: 'rgba(168,85,247,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #A855F7, #EC4899, #FB923C)' }}
            />
          </div>

          <AnimatePresence>
            {progress === 100 && stats.total > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontWeight: 700, color: '#10B981', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginTop: '8px' }}
              >
                🎉 все задачи выполнены!
              </motion.p>
            )}
          </AnimatePresence>
        </header>

        {/* ── INPUT AREA ─────────────────────────────────────── */}
        <div className="mb-8">
          <div style={{ ...glass('0 8px 36px rgba(168,85,247,0.12)'), padding: '4px' }}>

            <form onSubmit={addTodo} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px 10px' }}>
              <input
                type="text" value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Что нужно сделать? ✨"
                style={{ flex: 1, minWidth: 0, fontFamily: NU, fontWeight: 500, fontSize: '16px', background: 'transparent', border: 'none', outline: 'none', color: '#2D1B69' }}
                className="placeholder:text-purple-200"
              />
              <button type="button" onClick={toggleListening}
                style={{ flexShrink: 0, padding: '8px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: isListening ? '#EC4899' : '#C4B5FD', transition: 'all 0.2s' }}
                className={isListening ? 'animate-pulse' : ''}
                aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button type="submit" disabled={!inputValue.trim()}
                style={{
                  flexShrink: 0, padding: '10px 18px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #A855F7, #EC4899)', color: 'white',
                  cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  opacity: inputValue.trim() ? 1 : 0.3,
                  boxShadow: inputValue.trim() ? '0 4px 16px rgba(168,85,247,0.35)' : 'none',
                }}
                className="active:scale-95"
              >
                <Plus size={18} />
              </button>
            </form>

            <div style={{ padding: '8px 16px 14px', borderTop: '1px solid rgba(168,85,247,0.07)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {PRIORITIES.map(p => (
                  <button key={p.id} onClick={() => setSelectedPriority(p.id)}
                    style={{
                      fontFamily: NU, fontWeight: 700, fontSize: '11px',
                      padding: '4px 12px', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s',
                      border: `1.5px solid ${selectedPriority === p.id ? p.hex : 'transparent'}`,
                      background: selectedPriority === p.id ? p.pillBg : 'transparent',
                      color: selectedPriority === p.id ? p.hex : '#C4B5FD',
                    }}
                  >{p.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button key={c.id} onClick={() => setSelectedColor(c.id)}
                    style={{
                      width: selectedColor === c.id ? '18px' : '14px',
                      height: selectedColor === c.id ? '18px' : '14px',
                      borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer',
                      outline: selectedColor === c.id ? `3px solid ${c.hex}55` : 'none',
                      outlineOffset: '2px', transition: 'all 0.2s',
                      opacity: selectedColor === c.id ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'active', 'completed'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  fontFamily: NU, fontWeight: 700, fontSize: '12px',
                  padding: '6px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? 'linear-gradient(135deg, #A855F7, #EC4899)' : 'rgba(255,255,255,0.6)',
                  color: filter === f ? 'white' : '#9B84BC',
                  backdropFilter: 'blur(8px)',
                  boxShadow: filter === f ? '0 4px 14px rgba(168,85,247,0.3)' : 'none',
                }}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AnimatePresence>
              {stats.completed > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearCompleted}
                  style={{ fontFamily: NU, fontWeight: 700, fontSize: '11px', color: '#F472B6', background: 'rgba(244,114,182,0.1)', border: 'none', borderRadius: '999px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  className="hover:opacity-70 transition-opacity"
                >
                  <Trash2 size={11} /> Очистить
                </motion.button>
              )}
            </AnimatePresence>
            <span className="hidden sm:block" style={{ fontFamily: NU, fontWeight: 700, fontSize: '11px', color: '#C4B5FD' }}>
              {filteredTodos.length} задач
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
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                    className="group mb-3"
                    style={{
                      background: todo.completed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.78)',
                      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                      border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: '18px',
                      boxShadow: todo.completed ? '0 2px 12px rgba(0,0,0,0.04)' : `0 4px 28px ${cc.glow}, 0 2px 6px rgba(0,0,0,0.04)`,
                      opacity: todo.completed ? 0.72 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' }}>

                      {/* Checkbox */}
                      <button onClick={() => toggleTodo(todo.id)}
                        style={{ flexShrink: 0, marginTop: '2px', border: 'none', background: 'transparent', cursor: 'pointer', color: todo.completed ? '#A855F7' : 'rgba(168,85,247,0.25)', transition: 'all 0.2s' }}
                        className="hover:scale-110"
                      >
                        {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>

                      {/* Content */}
                      {editingId === todo.id ? (
                        <div style={{ flexGrow: 1 }}>
                          <input autoFocus type="text" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(todo.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') cancelEdit(); }}
                            style={{ width: '100%', fontFamily: NU, fontWeight: 600, fontSize: '15px', background: 'transparent', border: 'none', borderBottom: '2px solid #A855F7', outline: 'none', color: '#2D1B69', paddingBottom: '4px', marginBottom: '10px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {PRIORITIES.map(p => (
                                <button key={p.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { priority: p.id }); }}
                                  style={{ fontFamily: NU, fontWeight: 700, fontSize: '10px', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer', border: `1.5px solid ${todo.priority === p.id ? p.hex : 'transparent'}`, background: todo.priority === p.id ? p.pillBg : 'transparent', color: todo.priority === p.id ? p.hex : '#C4B5FD' }}
                                >{p.label}</button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {COLORS.map(c => (
                                <button key={c.id}
                                  onMouseDown={e => { e.preventDefault(); updateTodoProperty(todo.id, { color: c.id }); }}
                                  style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer', outline: todo.color === c.id ? `3px solid ${c.hex}55` : 'none', outlineOffset: '2px', opacity: todo.color === c.id ? 1 : 0.35 }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <span style={{ display: 'inline-block', fontFamily: NU, fontWeight: 700, fontSize: '10px', color: pc.hex, background: pc.pillBg, borderRadius: '999px', padding: '2px 10px', marginBottom: '5px' }}>
                            {pc.label}
                          </span>
                          <p
                            onDoubleClick={() => !todo.completed && startEditing(todo.id, todo.text)}
                            style={{ fontFamily: NU, fontWeight: todo.completed ? 400 : 600, fontSize: '15px', lineHeight: 1.5, color: todo.completed ? '#C4B5FD' : '#2D1B69', textDecoration: todo.completed ? 'line-through' : 'none', textDecorationColor: '#C4B5FD', cursor: 'text', margin: 0, wordBreak: 'break-word' }}
                          >
                            {todo.text}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginTop: '2px' }}>
                        {!todo.completed && editingId !== todo.id && (
                          <button onClick={() => startEditing(todo.id, todo.text)}
                            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#C4B5FD', cursor: 'pointer', transition: 'all 0.2s' }}
                            className="hover:bg-purple-50 hover:!text-purple-400"
                            aria-label="Редактировать"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteTodo(todo.id)}
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#C4B5FD', cursor: 'pointer', transition: 'all 0.2s' }}
                          className="hover:bg-pink-50 hover:!text-pink-400"
                          aria-label="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ color: '#DDD6FE', marginBottom: '16px' }}>
                    {filter === 'completed' ? <CheckCircle size={40} style={{ margin: '0 auto' }} />
                      : filter === 'active'  ? <CircleDashed size={40} style={{ margin: '0 auto' }} />
                      : <ListTodo size={40} style={{ margin: '0 auto' }} />}
                  </div>
                  <p style={{ fontFamily: NU, fontWeight: 600, color: '#C4B5FD', fontSize: '16px' }}>
                    {filter === 'all' ? 'Пусто ✨ Самое время добавить задачи!'
                      : filter === 'active' ? 'Все задачи выполнены! 🎉'
                      : 'Нет выполненных задач. Вперёд! 💪'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        {todos.length > 0 && (
          <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(168,85,247,0.1)', display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <span style={{ fontFamily: NU, fontWeight: 700, fontSize: '11px', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A78BFA', boxShadow: '0 0 8px rgba(167,139,250,0.6)', display: 'inline-block' }} />
              {stats.active} активно
            </span>
            <span style={{ fontFamily: NU, fontWeight: 700, fontSize: '11px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.6)', display: 'inline-block' }} />
              {stats.completed} выполнено
            </span>
          </footer>
        )}

      </div>
    </div>
  );
}
