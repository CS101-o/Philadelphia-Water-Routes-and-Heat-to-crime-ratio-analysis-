import { React, type AllWidgetProps } from 'jimu-core'

const { useState, useEffect } = React

interface Task { id: number, text: string, done: boolean }

const STARTER_TASKS: Task[] = [{ id: 1, text: 'Research Experience Builder...', done: false }]

// Notes are kept in this browser only, one list per widget instance
function storageKey (widgetId: string) { return `study-notes:${widgetId}` }

function loadTasks (widgetId: string): Task[] {
  try {
    const saved = window.localStorage.getItem(storageKey(widgetId))
    return saved ? JSON.parse(saved) : STARTER_TASKS
  } catch {
    return STARTER_TASKS
  }
}

export default function Widget (props: AllWidgetProps<any>) {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(props.id))
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try { window.localStorage.setItem(storageKey(props.id), JSON.stringify(tasks)) } catch { /* storage unavailable */ }
  }, [tasks, props.id])

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setTasks(ts => [...ts, { id: Date.now(), text, done: false }])
    setDraft('')
  }

  const toggle = (id: number) => { setTasks(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t))) }
  const remove = (id: number) => { setTasks(ts => ts.filter(t => t.id !== id)) }

  const remaining = tasks.filter(t => !t.done).length

  return (
    <div className='p-3 bg-light' style={{ borderRadius: '8px', border: '1px solid #ccc', height: '100%', overflow: 'auto' }}>
      <div className='d-flex justify-content-between align-items-baseline mb-2'>
        <h5 className='mb-0'>📝 Current Focus</h5>
        <span className='small text-muted'>{remaining} to do</span>
      </div>

      <form className='d-flex mb-3' style={{ gap: 6 }} onSubmit={addTask}>
        <input
          type='text'
          className='form-control form-control-sm'
          value={draft}
          onChange={(e) => { setDraft(e.target.value) }}
          placeholder='What are you working on?'
          aria-label='New task'
        />
        <button type='submit' className='btn btn-sm btn-primary' disabled={!draft.trim()}>Add</button>
      </form>

      {tasks.length === 0 && <div className='small text-muted text-center'>All clear 🎉</div>}

      <ul className='list-unstyled mb-0'>
        {tasks.map(t => (
          <li key={t.id} className='d-flex align-items-center p-2 mb-1 bg-warning text-dark' style={{ borderRadius: '4px', gap: 8, opacity: t.done ? 0.55 : 1 }}>
            <input type='checkbox' checked={t.done} onChange={() => { toggle(t.id) }} aria-label={`Mark "${t.text}" done`} />
            <span className='flex-grow-1' style={{ textDecoration: t.done ? 'line-through' : 'none', wordBreak: 'break-word' }}>{t.text}</span>
            <button type='button' className='btn btn-sm btn-link text-dark p-0' onClick={() => { remove(t.id) }} aria-label={`Delete "${t.text}"`}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
