import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { book_id, confirm } = await req.json()

    if (!book_id) {
      return new Response(
        JSON.stringify({ error: 'Book ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!confirm) {
      return new Response(
        JSON.stringify({ error: 'Confirmation required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get book details before deletion for audit
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('id', book_id)
      .single()

    if (fetchError || !book) {
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete files from storage
    try {
      // List all files in the book's folder
      const { data: files, error: listError } = await supabase.storage
        .from('books')
        .list(`books/${book_id}`)

      if (listError) {
        console.error('Error listing files:', listError)
      } else if (files && files.length > 0) {
        // Delete all files in the book's folder
        const filePaths = files.map(file => `books/${book_id}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from('books')
          .remove(filePaths)

        if (deleteError) {
          console.error('Error deleting files:', deleteError)
        }
      }
    } catch (error) {
      console.error('Error deleting storage files:', error)
    }

    // Delete book record
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', book_id)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Error deleting book record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create audit log
    await supabase
      .from('book_changes')
      .insert({
        book_id: book_id,
        admin_id: user.id,
        action: 'delete',
        changes: {
          deleted_book: {
            title: book.title,
            author: book.author,
            subject: book.subject,
            level: book.level,
            class_level: book.class_level,
          }
        }
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Book deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
