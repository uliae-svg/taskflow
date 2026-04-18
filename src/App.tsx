/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, CheckCircle, CircleDashed, Flag, Palette, Mic, MicOff, Pencil } from 'lucide-react';
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
  { id: 'slate',   bg: 'bg-slate-500',   hex: '#64748B' },
  { id: 'indigo',  bg: 'bg-indigo-500',  hex: '#6366F1' },
  { id: 'rose',    bg: 'bg-rose-500',    hex: '#F43F5E' },
  { id: 'amber',   bg: 'bg-amber-500',   hex: '#F59E0B' },
  { id: 'emerald', bg: 'bg-emerald-500', hex: '#10B981' },
];

const PRIORITIES: { id: Priority; label: string; hex: string }[] = [
  { id: 'low',    label: 'Низкий',  hex: '#2D8A99' },
  { id: 'medium', label: 'Средний', hex: '#C4800A' },
  { id: 'high',   label: 'Высокий', hex: '#CC3329' },
];

const FILTER_LABELS: Record<FilterType, string> = {
  all:       'Все',
  active:    'Активные',
  completed: 'Выполненные',
};

const MONO = "'Space Mono', 'Courier New', monospace";
const SERIF = "'Lora', Georgia, serif";
const DISPLAY = "'DM Serif Display', Georgia, serif";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('taskflow_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('taskflow_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
      priority: selectedPriority,
      color: selectedColor,
    };
    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const saveEdit = (id: string) => {
    if (!editValue.trim()) {
      deleteTodo(id);
    } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, text: editValue.trim() } : t));
    }
    setEditingId(null);
  };

  const updateTodoProperty = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const cancelEdit = () => setEditingId(null);

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend   = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':    return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t =>  t.completed);
      default:          return todos;
    }
  }, [todos, filter]);

  const stats = useMemo(() => {
    const completed = todos.filter(t => t.completed).length;
    return { total: todos.length, completed, active: todos.length - completed };
  }, [todos]);

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen" style={{ background: '#F6F1E9', color: '#1C1A26' }}>
      <div className="max-w-2xl mx-auto px-5 py-8 md:py-16">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="mb-10">
          <div style={{ height: '1.5px', background: '#1C1A26' }} className="mb-5" />
          <div className="flex items-end justify-between gap-4">
            <h1
              style={{ fontFamily: DISPLAY }}
              className="text-5xl sm:text-6xl md:text-7xl leading-[0.92] tracking-tight"
            >
              TaskFlow
            </h1>
            <div style={{ fontFamily: MONO }} className="text-right shrink-0 pb-1.5">
              <div className="text-[8px] uppercase tracking-[0.3em] mb-1" style={{ color: '#A09899' }}>
                выполнено
              </div>
              <div className="text-2xl sm:text-3xl leading-none">
                <span>{stats.completed}</span>
                <span style={{ color: '#C8C3BB' }} className="mx-1.5">/</span>
                <span>{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Progress IS the divider — the amber line fills as tasks complete */}
          <div className="relative mt-5" style={{ height: '2px', background: 'rgba(28,26,38,0.09)' }}>
            <motion.div
              className="absolute inset-y-0 left-0"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              style={{ background: '#C4800A' }}
            />
          </div>

          <AnimatePresence>
            {progress === 100 && stats.total > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontFamily: MONO, color: '#2D7A4F' }}
                className="text-[8px] uppercase tracking-[0.3em] mt-2 text-center"
              >
                ✦ все задачи выполнены ✦
              </motion.p>
            )}
          </AnimatePresence>
        </header>

        {/* ── INPUT AREA ─────────────────────────────────────── */}
        <div className="mb-8">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#FFFDF9',
              border: '1px solid rgba(28,26,38,0.08)',
              boxShadow: '0 2px 14px rgba(28,26,38,0.06), 0 1px 3px rgba(28,26,38,0.04)',
            }}
          >
            <form onSubmit={addTodo} className="flex items-center gap-2 px-4 pt-4 pb-3">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Что нужно сделать?"
                style={{ fontFamily: SERIF }}
                className="flex-1 min-w-0 text-base italic placeholder:italic bg-transparent focus:outline-none"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              />
              <button
                type="button"
                onClick={toggleListening}
                style={{ color: isListening ? '#CC3329' : '#C8C3BB' }}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-all hover:opacity-70 ${isListening ? 'animate-pulse' : ''}`}
                aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="flex-shrink-0 px-3.5 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center"
                style={{ background: '#1C1A26', color: '#F6F1E9' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div
              className="px-4 pb-3.5 pt-2.5 flex flex-wrap items-center gap-4"
              style={{ borderTop: '1px solid rgba(28,26,38,0.05)' }}
            >
              {/* Priority selector */}
              <div className="flex items-center gap-2.5">
                <Flag className="w-3 h-3" style={{ color: '#C8C3BB' }} />
                <div className="flex gap-3">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriority(p.id)}
                      style={{
                        fontFamily: MONO,
                        color: selectedPriority === p.id ? p.hex : '#C8C3BB',
                        borderBottom: selectedPriority === p.id
                          ? `1.5px solid ${p.hex}`
                          : '1.5px solid transparent',
                      }}
                      className="text-[9px] uppercase tracking-[0.2em] pb-0.5 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-2">
                <Palette className="w-3 h-3" style={{ color: '#C8C3BB' }} />
                <div className="flex gap-1.5">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                        selectedColor === c.id
                          ? 'ring-2 ring-offset-1 ring-[#1C1A26]/25 scale-110'
                          : 'opacity-30 hover:opacity-70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 px-0.5">
          <div className="flex gap-4">
            {(['all', 'active', 'completed'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: MONO,
                  color: filter === f ? '#1C1A26' : '#B8B3AB',
                  borderBottom: filter === f
                    ? '1.5px solid #1C1A26'
                    : '1.5px solid transparent',
                }}
                className="text-[9px] uppercase tracking-[0.22em] pb-0.5 transition-all"
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {stats.completed > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearCompleted}
                  style={{ fontFamily: MONO, color: '#CC3329' }}
                  className="text-[9px] uppercase tracking-[0.2em] flex items-center gap-1.5 hover:opacity-60 transition-all"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  Очистить
                </motion.button>
              )}
            </AnimatePresence>
            <span
              style={{ fontFamily: MONO, color: '#C8C3BB' }}
              className="hidden sm:block text-[9px] uppercase tracking-[0.2em]"
            >
              {filteredTodos.length} задач
            </span>
          </div>
        </div>

        {/* ── TODO LIST ──────────────────────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <AnimatePresence initial={false}>
              {filteredTodos.length > 0 ? (
                filteredTodos.map(todo => {
                  const priorityConfig = PRIORITIES.find(p => p.id === todo.priority);
                  const colorConfig    = COLORS.find(c => c.id === todo.color);

                  return (
                    <motion.article
                      key={todo.id}
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                      className="relative rounded-xl overflow-hidden mb-3 group"
                      style={{
                        background: todo.completed ? '#F3EFE6' : '#FFFDF9',
                        border: '1px solid rgba(28,26,38,0.07)',
                        boxShadow: '0 1px 4px rgba(28,26,38,0.05), 0 1px 2px rgba(28,26,38,0.04)',
                      }}
                    >
                      {/* Left color tab */}
                      {!todo.completed && (
                        <div
                          className="absolute inset-y-0 left-0 w-1"
                          style={{ backgroundColor: colorConfig?.hex }}
                        />
                      )}

                      <div className={`flex items-start gap-3 py-3.5 pr-4 ${!todo.completed ? 'pl-5' : 'pl-4'}`}>

                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="flex-shrink-0 mt-0.5 transition-all hover:scale-110"
                          style={{ color: todo.completed ? '#2D7A4F' : '#C8C3BB' }}
                        >
                          {todo.completed
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <Circle className="w-5 h-5" />
                          }
                        </button>

                        {/* Content */}
                        {editingId === todo.id ? (
                          <div className="flex-grow space-y-2.5">
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(todo.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter')  saveEdit(todo.id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              style={{ fontFamily: SERIF, borderBottom: '1.5px solid #C4800A' }}
                              className="w-full text-base italic bg-transparent focus:outline-none py-0.5 text-[#1C1A26]"
                            />
                            <div className="flex items-center gap-3">
                              <div className="flex gap-3">
                                {PRIORITIES.map(p => (
                                  <button
                                    key={p.id}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      updateTodoProperty(todo.id, { priority: p.id });
                                    }}
                                    style={{
                                      fontFamily: MONO,
                                      color: todo.priority === p.id ? p.hex : '#C8C3BB',
                                      borderBottom: todo.priority === p.id
                                        ? `1px solid ${p.hex}`
                                        : '1px solid transparent',
                                    }}
                                    className="text-[8px] uppercase tracking-[0.2em] pb-0.5 transition-all"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-1">
                                {COLORS.map(c => (
                                  <button
                                    key={c.id}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      updateTodoProperty(todo.id, { color: c.id });
                                    }}
                                    style={{ backgroundColor: c.hex }}
                                    className={`w-3 h-3 rounded-full transition-all ${
                                      todo.color === c.id
                                        ? 'ring-1 ring-offset-1 ring-[#1C1A26]/25 scale-110'
                                        : 'opacity-30 hover:opacity-70'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-grow min-w-0">
                            <span
                              style={{ fontFamily: MONO, color: priorityConfig?.hex }}
                              className="block text-[8px] uppercase tracking-[0.25em] mb-0.5"
                            >
                              {priorityConfig?.label}
                            </span>
                            <span
                              onDoubleClick={() => !todo.completed && startEditing(todo.id, todo.text)}
                              style={{ fontFamily: SERIF }}
                              className={`block text-base leading-relaxed break-words cursor-text transition-all duration-300 ${
                                todo.completed
                                  ? 'line-through text-[#B8B3AB] decoration-1'
                                  : 'text-[#1C1A26]'
                              }`}
                            >
                              {todo.text}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {!todo.completed && editingId !== todo.id && (
                            <button
                              onClick={() => startEditing(todo.id, todo.text)}
                              className="p-1.5 rounded-lg transition-all hover:opacity-60"
                              style={{ color: '#C8C3BB' }}
                              aria-label="Редактировать"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-1.5 rounded-lg transition-all hover:opacity-60"
                            style={{ color: '#C8C3BB' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#CC3329')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#C8C3BB')}
                            aria-label="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <div className="mb-5" style={{ color: '#D5D0C6' }}>
                    {filter === 'completed'
                      ? <CheckCircle   className="w-9 h-9 mx-auto" />
                      : filter === 'active'
                        ? <CircleDashed className="w-9 h-9 mx-auto" />
                        : <ListTodo    className="w-9 h-9 mx-auto" />
                    }
                  </div>
                  <p style={{ fontFamily: SERIF, color: '#C8C3BB' }} className="text-xl italic">
                    {filter === 'all'
                      ? 'Список пуст — время действовать'
                      : filter === 'active'
                        ? 'Все задачи выполнены'
                        : 'Нет выполненных задач'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        {todos.length > 0 && (
          <footer
            className="mt-12 pt-5 flex items-center justify-center gap-8"
            style={{ borderTop: '1px solid rgba(28,26,38,0.09)' }}
          >
            <span
              style={{ fontFamily: MONO, color: '#6366F1' }}
              className="text-[8px] uppercase tracking-[0.25em] flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.45)] inline-block" />
              {stats.active} Активно
            </span>
            <span
              style={{ fontFamily: MONO, color: '#059669' }}
              className="text-[8px] uppercase tracking-[0.25em] flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.45)] inline-block" />
              {stats.completed} Выполнено
            </span>
          </footer>
        )}

      </div>
    </div>
  );
}
