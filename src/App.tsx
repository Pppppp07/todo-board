import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ArrowRight, ArrowLeft, Edit2, Check, X, Info, AlertTriangle, Clock, Flag, ChevronDown, ChevronUp, PlayCircle, Paperclip, FileText, FileImage } from 'lucide-react'
import Joyride, { Step, CallBackProps, STATUS, TooltipRenderProps } from 'react-joyride'

type Priority = 'low' | 'medium' | 'high'
type ColumnType = 'todo' | 'doing' | 'done'

type Attachment = {
  name: string
  type: 'image' | 'document'
  data: string // base64
}

type Task = {
  id: number
  title: string
  status: ColumnType
  createdAt: number
  priority: Priority
  attachment?: Attachment
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
    title: 'Halo! 👋 Ini adalah task pertamamu. Coba arahkan mouse ke kartu ini untuk melihat menu aksi.',
    status: 'todo',
    createdAt: Date.now() - 100000,
    priority: 'high'
  },
  {
    id: Date.now() - 2000,
    title: 'Klik tombol panah untuk memindahkan tugas antar kolom.',
    status: 'doing',
    createdAt: Date.now() - 200000,
    priority: 'medium'
  }
]

// Custom Tooltip for Joyride with Framer Motion animations
function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-gray-800 border border-cyan-500/30 rounded-2xl p-5 max-w-sm shadow-2xl shadow-cyan-500/20 relative z-50"
    >
      {step.title && <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>}
      <div className="text-gray-300 text-sm mb-4 leading-relaxed">{step.content}</div>
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-700/50">
        <button {...closeProps} className="text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors">
          Lewati
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button {...backProps} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg font-medium transition-colors">
              Kembali
            </button>
          )}
          <motion.button 
            {...primaryProps} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg font-medium transition-colors shadow-lg shadow-cyan-600/20"
          >
            {continuous && !step.isLast ? 'Lanjut' : 'Selesai'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}


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
    return initialTutorialTasks
  })
  
  const [inputValue, setInputValue] = useState('')
  const [inputPriority, setInputPriority] = useState<Priority>('medium')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showTextTutorial, setShowTextTutorial] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  // Tutorial State
  const [runTour, setRunTour] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-start tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour')
    if (!hasSeenTour) {
      setRunTour(true)
    }
  }, [])

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 500KB)
    if (file.size > 500 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 500KB untuk menjaga performa browser.")
      e.target.value = ''
      return
    }

    const isImage = file.type.startsWith('image/')
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const data = event.target?.result as string
      setAttachment({
        name: file.name,
        type: isImage ? 'image' : 'document',
        data
      })
    }
    
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeAttachment = () => {
    setAttachment(null)
  }

  const addTask = () => {
    if (inputValue.trim() === '' && !attachment) return
    const newTask: Task = {
      id: Date.now(),
      title: inputValue.trim(),
      status: 'todo',
      createdAt: Date.now(),
      priority: inputPriority,
      ...(attachment && { attachment })
    }
    setTasks([...tasks, newTask])
    setInputValue('')
    setInputPriority('medium')
    setAttachment(null)
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

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]
    if (finishedStatuses.includes(status)) {
      setRunTour(false)
      localStorage.setItem('hasSeenTour', 'true')
    }
  }

  const steps: Step[] = [
    {
      target: '.tour-input',
      content: 'Ketik aktivitas atau tugas baru yang ingin kamu kerjakan di sini.',
      disableBeacon: true,
      title: 'Selamat Datang!',
    },
    {
      target: '.tour-attachment',
      content: 'Upload gambar atau dokumen kecil (Maks 500KB) untuk melengkapi tugasmu.',
      title: 'Lampirkan File',
    },
    {
      target: '.tour-priority',
      content: 'Pilih tingkat prioritas tugas kamu (Rendah, Sedang, atau Tinggi).',
      title: 'Tentukan Prioritas',
    },
    {
      target: '.tour-add',
      content: 'Klik tombol ini untuk menambahkan tugasmu ke dalam daftar "To Do".',
    },
    {
      target: '.tour-columns',
      content: 'Semua tugasmu akan tersusun di tiga kolom ini. Kamu bisa memindahkannya menggunakan panah di kartu tugas.',
      title: 'Papan Kerja',
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative overflow-hidden font-sans">
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        tooltipComponent={CustomTooltip}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            arrowColor: '#1f2937',
            overlayColor: 'rgba(3, 7, 18, 0.85)',
            zIndex: 1000,
          }
        }}
      />

      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] z-0"
        animate={{
          x: mousePosition.x - 250,
          y: mousePosition.y - 250,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.8 }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <button 
              onClick={() => { setRunTour(true); setShowTextTutorial(false) }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 text-cyan-400 hover:bg-cyan-900/40 rounded-full transition-colors border border-gray-700 hover:border-cyan-700 shadow-sm"
              title="Mulai Tur Visual"
            >
              <PlayCircle size={14} />
              Tur Interaktif
            </button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3 text-center mt-8 md:mt-0 drop-shadow-sm">
            Todo Board
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
            <span className="bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700 shadow-inner">Total: {tasks.length} Tugas</span>
          </div>
        </div>

        {/* Form Input Terstruktur */}
        <div className="max-w-xl mx-auto bg-gray-800/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-700 shadow-xl flex flex-col mb-10 transition-all focus-within:border-cyan-500/50 focus-within:bg-gray-800/80">
          
          {/* Attachment Preview (if any) */}
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pt-3 flex items-center gap-2"
              >
                <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-700 py-1.5 px-3 rounded-lg text-sm text-cyan-400">
                  {attachment.type === 'image' ? <FileImage size={14}/> : <FileText size={14}/>}
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                  <button onClick={removeAttachment} className="ml-2 p-0.5 bg-gray-700 hover:bg-rose-500 hover:text-white rounded-md transition-colors text-gray-400">
                    <X size={12}/>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
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
                className="tour-input w-full px-4 pt-3 pb-2 bg-transparent focus:outline-none text-gray-200 placeholder:text-gray-500 resize-none overflow-hidden min-h-[44px]"
              />
              <div className="flex px-3 pb-2 gap-1 items-center flex-wrap">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="tour-attachment p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border border-transparent text-gray-400 hover:text-cyan-400 hover:bg-gray-700/50 mr-2"
                  title="Lampirkan File (Maks 500KB)"
                >
                  <Paperclip size={14} />
                  <span className="hidden sm:inline">Attach</span>
                </button>

                <div className="tour-priority flex items-center gap-1 border-l border-gray-700 pl-3">
                  {(['low', 'medium', 'high'] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setInputPriority(p)}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border ${
                        inputPriority === p 
                          ? 'border-gray-600 bg-gray-700 text-white shadow-sm' 
                          : 'border-transparent text-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <Flag size={12} className={priorityConfig[p].iconColor} />
                      <span className="hidden sm:inline capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={addTask}
              className="tour-add mb-2 mr-2 px-6 h-[44px] bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 text-white"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </motion.button>
          </div>
        </div>

        {/* Board Layout (3 Kolom) */}
        <div className="tour-columns grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                  <span className="bg-gray-700/80 text-gray-300 text-xs px-3 py-1 rounded-full font-medium shadow-inner border border-gray-600/50">
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
                        <div className="w-12 h-12 border-2 border-dashed border-gray-700/60 rounded-full flex items-center justify-center mb-3">
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
      className="bg-gray-800/80 hover:bg-gray-750 backdrop-blur-sm rounded-xl p-4 border border-gray-700/60 shadow-md group transition-all relative overflow-hidden"
    >
      {editingId === task.id ? (
        <div className="flex flex-col gap-3 relative z-10">
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
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors shadow-lg shadow-cyan-600/20"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : deletingId === task.id ? (
        <div className="flex flex-col items-center justify-center py-2 gap-3 text-center relative z-10">
          <AlertTriangle size={24} className="text-rose-500" />
          <p className="text-sm text-gray-300 font-medium">Hapus tugas ini secara permanen?</p>
          <div className="flex gap-2 w-full mt-1">
            <button onClick={() => setDeletingId(null)} className="flex-1 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Batal</button>
            <button onClick={() => deleteTask(task.id)} className="flex-1 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-600/20">Hapus</button>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityConfig[task.priority].color} flex items-center gap-1 border border-transparent`}>
              {priorityConfig[task.priority].label}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-900/50 px-2 py-0.5 rounded-full" title={new Date(task.createdAt).toLocaleString()}>
              <Clock size={10} />
              {getRelativeTime(task.createdAt)}
            </div>
          </div>
          
          <div className="text-sm text-gray-200 mb-3 whitespace-pre-wrap leading-relaxed">
            {expanded || !isLong ? task.title : `${task.title.substring(0, 100)}...`}
            {isLong && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="inline-block ml-1 mt-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 items-center gap-1 transition-colors"
              >
                {expanded ? '(Lebih Sedikit)' : '(Selengkapnya)'}
              </button>
            )}
          </div>

          {/* Attachment Display */}
          {task.attachment && (
            <div className="mb-4 mt-2">
              {task.attachment.type === 'image' ? (
                <div className="relative group/img overflow-hidden rounded-lg border border-gray-700">
                  <img src={task.attachment.data} alt="Lampiran" className="w-full max-h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <a href={task.attachment.data} download={task.attachment.name} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors">
                      <ChevronDown size={14}/> Download
                    </a>
                  </div>
                </div>
              ) : (
                <a href={task.attachment.data} download={task.attachment.name} className="flex items-center gap-2 p-2.5 bg-gray-900/80 border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 rounded-lg text-xs text-cyan-400 transition-all group/doc">
                  <FileText size={16} className="text-cyan-500 group-hover/doc:text-cyan-400" /> 
                  <span className="truncate flex-1">{task.attachment.name}</span>
                  <ChevronDown size={14} className="text-gray-500 group-hover/doc:text-cyan-400" />
                </a>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-700/50 mt-1">
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
                title="Hapus"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex gap-1.5">
              {status !== 'todo' && (
                <button
                  onClick={() => moveTask(task.id, status === 'doing' ? 'todo' : 'doing')}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all border border-transparent hover:border-gray-500"
                  title="Geser Kiri"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {status !== 'done' && (
                <button
                  onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all border border-transparent hover:border-gray-500"
                  title="Geser Kanan"
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default App
