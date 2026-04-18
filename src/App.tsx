/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, CheckCircle, CircleDashed, Flag, Palette, Mic, MicOff } from 'lucide-react';
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

  const colors = [
    { id: 'slate', bg: 'bg-slate-500', border: 'border-slate-200', light: 'bg-slate-50/50' },
    { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-200', light: 'bg-indigo-50/50' },
    { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-200', light: 'bg-rose-50/50' },
    { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-200', light: 'bg-amber-50/50' },
    { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-200', light: 'bg-emerald-50/50' },
  ];

  const priorities: { id: Priority; label: string; color: string }[] = [
    { id: 'low', label: 'Низкий', color: 'text-cyan-600' },
    { id: 'medium', label: 'Средний', color: 'text-amber-600' },
    { id: 'high', label: 'Высокий', color: 'text-rose-600' },
  ];

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

    setTodos([newTodo, ...todos]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const saveEdit = (id: string) => {
    if (!editValue.trim()) {
      deleteTodo(id);
    } else {
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, text: editValue.trim() } : todo
      ));
    }
    setEditingId(null);
  };

  const updateTodoProperty = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  }, [todos, filter]);

  const filterLabels: Record<FilterType, string> = {
    all: 'Все',
    active: 'Активные',
    completed: 'Выполненные'
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.length - todos.filter(t => t.completed).length,
  };

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-20">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <ListTodo className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">TaskFlow</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Прогресс</p>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.completed}<span className="text-slate-300 mx-1">/</span>{stats.total}
            </p>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="mb-8 md:mb-12">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
              className={`h-full rounded-full ${
                progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
            />
          </div>
          {progress === 100 && stats.total > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-emerald-600 mt-2 text-center uppercase tracking-[0.2em]"
            >
              🎉 Все задачи выполнены! Отличная работа!
            </motion.p>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-6 md:mb-10 shadow-sm group hover:border-slate-300 transition-all">
          <form onSubmit={addTodo} className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Что нужно сделать?"
              className="flex-1 bg-transparent px-3 py-1.5 text-base focus:outline-none placeholder:text-slate-400 font-medium min-w-0"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex-shrink-0 px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:active:scale-100 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
          
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                  {priorities.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriority(p.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${
                        selectedPriority === p.id
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex gap-1">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-5 h-5 rounded-full transition-all ${c.bg} ${
                        selectedColor === c.id 
                          ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' 
                          : 'opacity-40 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stats.completed > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearCompleted}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                Очистить
              </motion.button>
            )}
            <div className="hidden sm:flex px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] items-center gap-2 border-l border-slate-200 ml-1">
              Задач: {filteredTodos.length}
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredTodos.length > 0 ? (
              filteredTodos.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                  className={`group flex items-center gap-4 bg-white py-3 px-4 rounded-xl border-l-4 transition-all hover:shadow-sm ${
                    todo.completed 
                      ? 'border-slate-100 bg-slate-50/50 opacity-75' 
                      : `border-slate-200 border-l-${todo.color}-500`
                  }`}
                  style={{
                    backgroundColor: !todo.completed ? `var(--color-${todo.color}-50)` : undefined,
                    borderColor: !todo.completed ? `var(--color-${todo.color}-500)` : undefined
                  }}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 transition-colors ${
                      todo.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'
                    }`}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-6 h-6 fill-emerald-50" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  
                  {editingId === todo.id ? (
                    <div className="flex-grow space-y-2">
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full text-base bg-white border-b border-indigo-500 focus:outline-none py-1 px-1 transition-all font-medium"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                          {priorities.map((p) => (
                            <button
                              key={p.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                updateTodoProperty(todo.id, { priority: p.id });
                              }}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                todo.priority === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {colors.map((c) => (
                            <button
                              key={c.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                updateTodoProperty(todo.id, { color: c.id });
                              }}
                              className={`w-3.5 h-3.5 rounded-full ${c.bg} ${
                                todo.color === c.id ? 'ring-1 ring-offset-1 ring-indigo-500' : 'opacity-40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Flag className={`w-2.5 h-2.5 ${priorities.find(p => p.id === todo.priority)?.color}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${priorities.find(p => p.id === todo.priority)?.color}`}>
                          {priorities.find(p => p.id === todo.priority)?.label}
                        </span>
                      </div>
                      <span
                        onDoubleClick={() => !todo.completed && startEditing(todo.id, todo.text)}
                        className={`block text-base transition-all duration-300 cursor-text truncate ${
                          todo.completed ? 'text-slate-400 line-through decoration-1' : 'text-slate-700 font-medium'
                        }`}
                      >
                        {todo.text}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!todo.completed && editingId !== todo.id && (
                      <button
                        onClick={() => startEditing(todo.id, todo.text)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        aria-label="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-300 mb-4">
                  {filter === 'completed' ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : filter === 'active' ? (
                    <CircleDashed className="w-8 h-8" />
                  ) : (
                    <ListTodo className="w-8 h-8" />
                  )}
                </div>
                <p className="text-slate-400 font-medium">
                  {filter === 'all' 
                    ? "Ваш список пуст. Самое время добавить задачи!" 
                    : filter === 'active' 
                      ? "Нет активных задач. Вы со всем справились!" 
                      : "Нет выполненных задач. Продолжайте в том же духе!"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        {todos.length > 0 && (
          <footer className="mt-10 sm:mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <p className="opacity-60">Создано с React и Tailwind CSS</p>
            <div className="flex gap-6">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                {stats.active} Активно
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                {stats.completed} Выполнено
              </span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
