'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/browser'

function Page() {
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    async function getTodos() {
      const supabase = createClient()
      const { data: todos } = await supabase.from('todos').select()

      if (todos && todos.length > 0) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title || todo}</li>
        ))}
      </ul>
    </div>
  )
}

export default Page
