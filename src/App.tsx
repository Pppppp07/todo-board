import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Task = {
  id: number
  title: string
  status: 'todo' | 'doing' | 'done'
}

type ColumnType = 'todo' | 'doing' | 'done'

const columnConfig: Record<ColumnType, { title: string; emoji: string; color: string }> = {
  todo: { title: 'To Do', emoji: '📝', color: 'border-blue-500' },
  doing: { title: 'In Progress', emoji: '⏳', color: 'border-yellow-500' },
  done: { title: 'Done', emoji: '✅', color: 'border-green-500' }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const addTask = () => {
    if (inputValue.trim() === '') return
    const newTask: Task = {
      id: Date.now(),
      title: inputValue.trim(),
      status: 'todo'
    }
    setTasks([...tasks, newTask])
    setInputValue('')
  }

  const moveTask = (taskId: number, newStatus: ColumnType) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId))
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

  const columns: ColumnType[] = ['todo', 'doing', 'done']

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative overflow-hidden">
      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] z-0"
        animate={{
          x: mousePosition.x - 250,
          y: mousePosition.y - 250,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.8 }}
      />

      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-center mb-8">Todo Board</h1>
        <p className="text-center text-gray-400 mb-6">
          Tasks: {tasks.length} | Input: "{inputValue}"
        </p>

        <div className="max-w-md mx-auto flex gap-2 mb-8">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Tambah task baru..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addTask}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            + Add
          </motion.button>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm transition-colors">
            Todo: {getTasksByStatus('todo').length}
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-sm transition-colors">
            Doing: {getTasksByStatus('doing').length}
          </div>
          <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm transition-colors">
            Done: {getTasksByStatus('done').length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {columns.map(status => {
            const config = columnConfig[status]
            const columnTasks = getTasksByStatus(status)

            return (
              <div
                key={status}
                className={`bg-gray-800/50 rounded-xl p-4 border-t-4 ${config.color} backdrop-blur-sm shadow-lg`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">
                    {config.emoji} {config.title}
                  </h2>
                  <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.length === 0 ? (
                      <motion.p
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-gray-600 text-sm text-center py-8"
                      >
                        No tasks yet.
                      </motion.p>
                    ) : (
                      columnTasks.map(task => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: -20 }}
                          whileHover={{ y: -2 }}
                          key={task.id}
                          className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-all group"
                        >
                          {editingId === task.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 text-sm"
                                autoFocus
                              />
                              <div className="flex gap-1 justify-end mt-1">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveEdit}
                                  className="text-xs px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm mb-2">{task.title}</p>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap mt-2">
                                <button
                                  onClick={() => startEditing(task)}
                                  className="text-xs px-2 py-1 bg-indigo-600/50 hover:bg-indigo-600 rounded transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                {status !== 'todo' && (
                                  <button
                                    onClick={() => moveTask(task.id, status === 'doing' ? 'todo' : 'doing')}
                                    className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors cursor-pointer"
                                  >
                                    Back
                                  </button>
                                )}
                                {status !== 'done' && (
                                  <button
                                    onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')}
                                    className="text-xs px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded transition-colors cursor-pointer"
                                  >
                                    Next
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-xs px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded transition-colors ml-auto cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
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

export default App
