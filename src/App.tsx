import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ArrowRight, ArrowLeft, Edit2, Check, X, Info, AlertTriangle, Clock, Flag, ChevronDown, ChevronUp } from 'lucide-react'

type Priority = 'low' | 'medium' | 'high'
type ColumnType = 'todo' | 'doing' | 'done'

type Task = {
  id: number
  title: string
  status: ColumnType
  createdAt: number
  priority: Priority
}

const priorityConfig = {
  low: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Low', iconColor: 'text-emerald-400' },
  medium: { color: 'bg-amber-500/20 text-amber-400', label: 'Medium', iconColor: 'text-amber-400' },
  high: { color: 'bg-rose-500/20 text-rose-400', label: 'High', iconColor: 'text-rose-400' },
}

const columnConfig: Record<ColumnType, { title: string; emoji: string; color: string }> = {
  todo: { title: 'To Do', emoji: '📝', color: 'border-blue-500' },
  doing: { title: 'In Progress', emoji: '⏳', color: 'border-yellow-500' },
  done: { title: 'Done', emoji: '✅', color: 'border-green-500' }
}

const getRelativeTime = (timestamp: number) => {
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24))
  const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60))
  const minutesDifference = Math.round((timestamp - Date.now()) / (1000 * 60))

  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day')
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour')
  if (Math.abs(minutesDifference) > 0) return rtf.format(minutesDifference, 'minute')
  return 'Baru saja'
}

const initialTutorialTasks: Task[] = [
  {
    id: Date.now() - 3000,
    title: 'Halo! 👋 Ini adalah task pertamamu. Coba klik tombol Edit (ikon pensil) di bawah untuk mengubah teks ini.',
    status: 'todo',
    createdAt: Date.now() - 100000,
    priority: 'high'
  },
  {
    id: Date.now() - 2000,
    title: 'Tugas yang sedang dikerjakan bisa dipindahkan ke kanan (Done) atau ke kiri (To Do) menggunakan tombol panah.',
    status: 'doing',
    createdAt: Date.now() - 200000,
    priority: 'medium'
  },
  {
    id: Date.now() - 1000,
    title: 'Kamu juga bisa memberi label prioritas saat membuat tugas. Jika teks tugas sangat panjang (seperti teks tutorial yang sedang kamu baca saat ini karena sengaja dibuat panjang agar melebihi batas 100 karakter), kamu bisa menekan tombol Expand untuk melihat keseluruhan teksnya dengan lebih nyaman. Coba klik Show more sekarang!',
    status: 'done',
    createdAt: Date.now() - 300000,
    priority: 'low'
  }
]

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks-v2')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialTutorialTasks
      }
    }
    // Jika tidak ada data, gunakan tutorial
    return initialTutorialTasks
  })
  
  const [inputValue, setInputValue] = useState('')
  const [inputPriority, setInputPriority] = useState<Priority>('medium')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showTutorial, setShowTutorial] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem('tasks-v2', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const addTask = () => {
    if (inputValue.trim() === '') return
    const newTask: Task = {
      id: Date.now(),
      title: inputValue.trim(),
      status: 'todo',
      createdAt: Date.now(),
      priority: inputPriority
    }
    setTasks([...tasks, newTask])
    setInputValue('')
    setInputPriority('medium')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const moveTask = (taskId: number, newStatus: ColumnType) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const confirmDelete = (taskId: number) => {
    setDeletingId(taskId)
  }

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId))
    setDeletingId(null)
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditValue(task.title)
  }

  const saveEdit = () => {
    if (editValue.trim() === '') return
    setTasks(tasks.map(task =>
      task.id === editingId ? { ...task, title: editValue.trim() } : task
    ))
    setEditingId(null)
  }

  const getTasksByStatus = (status: ColumnType) => {
    return tasks.filter(task => task.status === status)
  }

  const resetTutorial = () => {
    setTasks(initialTutorialTasks)
    setShowTutorial(false)
  }

  const columns: ColumnType[] = ['todo', 'doing', 'done']

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative overflow-hidden font-sans">
      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] z-0"
        animate={{
          x: mousePosition.x - 250,
          y: mousePosition.y - 250,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.8 }}
      />

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-4 text-cyan-400">
                <Info size={28} />
                <h2 className="text-xl font-bold text-white">Panduan Singkat</h2>
              </div>
              <ul className="space-y-3 text-gray-300 text-sm mb-6">
                <li className="flex items-start gap-2">
                  <span className="mt-1">📝</span> 
                  <span><strong>Tambah Tugas:</strong> Ketik tugasmu di kotak input atas, pilih prioritas (bendera), lalu tekan Add.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">↔️</span> 
                  <span><strong>Pindah Kolom:</strong> Gunakan ikon panah di bagian bawah kartu untuk memindahkan tugas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✏️</span> 
                  <span><strong>Edit & Hapus:</strong> Arahkan mouse ke kartu untuk melihat ikon Edit dan Hapus.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">📖</span> 
                  <span><strong>Teks Panjang:</strong> Teks yang melebihi batas akan otomatis dipotong, klik "Show more" untuk membaca penuh.</span>
                </li>
              </ul>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTutorial(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={resetTutorial}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
                >
                  Reset Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 relative">
          <button 
            onClick={() => setShowTutorial(true)}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors group"
            title="Bantuan & Panduan"
          >
            <Info size={24} />
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3 text-center">
            Todo Board
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
            <span className="bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700">Total: {tasks.length} Tugas</span>
          </div>
        </div>

        {/* Form Input Terstruktur */}
        <div className="max-w-xl mx-auto bg-gray-800/60 backdrop-blur-md p-2 rounded-2xl border border-gray-700 shadow-xl flex gap-2 mb-10 items-end transition-all focus-within:border-cyan-500/50 focus-within:bg-gray-800">
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addTask()
                }
              }}
              placeholder="Apa yang ingin kamu kerjakan hari ini?"
              className="w-full px-4 pt-3 pb-2 bg-transparent focus:outline-none text-gray-200 placeholder:text-gray-500 resize-none overflow-hidden min-h-[44px]"
            />
            <div className="flex px-3 pb-2 gap-1 items-center">
              <span className="text-xs text-gray-500 font-medium mr-2">Priority:</span>
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setInputPriority(p)}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border ${
                    inputPriority === p 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-transparent text-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <Flag size={12} className={priorityConfig[p].iconColor} />
                  <span className="hidden sm:inline capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addTask}
            className="mb-2 mr-2 px-6 h-[44px] bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 text-white"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add</span>
          </motion.button>
        </div>

        {/* Board Layout (3 Kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {columns.map(status => {
            const config = columnConfig[status]
            const columnTasks = getTasksByStatus(status)

            return (
              <div
                key={status}
                className={`bg-gray-800/40 rounded-2xl p-5 border-t-4 ${config.color} backdrop-blur-xl shadow-lg border-x border-b border-gray-700/50 flex flex-col`}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-gray-200">
                    <span className="text-xl">{config.emoji}</span> {config.title}
                  </h2>
                  <span className="bg-gray-700/80 text-gray-300 text-xs px-3 py-1 rounded-full font-medium shadow-inner">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[150px] flex-1">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center py-12 text-gray-600"
                      >
                        <div className="w-12 h-12 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-3">
                          <Check size={20} className="text-gray-700" />
                        </div>
                        <p className="text-sm font-medium">Kosong</p>
                      </motion.div>
                    ) : (
                      columnTasks.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          status={status}
                          editingId={editingId}
                          editValue={editValue}
                          setEditValue={setEditValue}
                          startEditing={startEditing}
                          saveEdit={saveEdit}
                          setEditingId={setEditingId}
                          moveTask={moveTask}
                          deleteTask={deleteTask}
                          confirmDelete={confirmDelete}
                          deletingId={deletingId}
                          setDeletingId={setDeletingId}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TaskCard({ 
  task, status, editingId, editValue, setEditValue, startEditing, 
  saveEdit, setEditingId, moveTask, deleteTask, confirmDelete, 
  deletingId, setDeletingId 
}: { 
  task: Task, 
  status: ColumnType, 
  editingId: number | null, 
  editValue: string, 
  setEditValue: (v: string) => void, 
  startEditing: (t: Task) => void, 
  saveEdit: () => void, 
  setEditingId: (id: number | null) => void,
  moveTask: (id: number, status: ColumnType) => void,
  deleteTask: (id: number) => void,
  confirmDelete: (id: number) => void,
  deletingId: number | null,
  setDeletingId: (id: number | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = task.title.length > 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      whileHover={{ y: -4 }}
      className="bg-gray-800/80 hover:bg-gray-750 backdrop-blur-sm rounded-xl p-4 border border-gray-700/60 shadow-md group transition-all"
    >
      {editingId === task.id ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                saveEdit()
              }
            }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm text-gray-200 resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditingId(null)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={saveEdit}
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : deletingId === task.id ? (
        <div className="flex flex-col items-center justify-center py-2 gap-3 text-center">
          <AlertTriangle size={24} className="text-rose-500" />
          <p className="text-sm text-gray-300 font-medium">Hapus tugas ini?</p>
          <div className="flex gap-2 w-full mt-1">
            <button onClick={() => setDeletingId(null)} className="flex-1 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Batal</button>
            <button onClick={() => deleteTask(task.id)} className="flex-1 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors">Hapus</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityConfig[task.priority].color} flex items-center gap-1`}>
              {priorityConfig[task.priority].label}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium" title={new Date(task.createdAt).toLocaleString()}>
              <Clock size={10} />
              {getRelativeTime(task.createdAt)}
            </div>
          </div>
          
          <div className="text-sm text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">
            {expanded || !isLong ? task.title : `${task.title.substring(0, 100)}...`}
            {isLong && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="block mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {expanded ? <><ChevronUp size={14}/> Show less</> : <><ChevronDown size={14}/> Show more</>}
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEditing(task)}
                className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => confirmDelete(task.id)}
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex gap-1.5">
              {status !== 'todo' && (
                <button
                  onClick={() => moveTask(task.id, status === 'doing' ? 'todo' : 'doing')}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all"
                  title="Move left"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {status !== 'done' && (
                <button
                  onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all"
                  title="Move right"
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default App
