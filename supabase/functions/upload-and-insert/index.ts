import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create } from "https://deno.land/x/deno_pdf@2.0.0/mod.ts"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY)!
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

    // Parse form data
    const formData = await req.formData()
    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const subject = formData.get('subject') as string
    const level = formData.get('level') as string
    const class_level = formData.get('class_level') as string
    const description = formData.get('description') as string
    const featured = formData.get('featured') === 'true'
    const pdfFile = formData.get('pdf') as File
    const coverFile = formData.get('cover') as File

    if (!title || !pdfFile) {
      return new Response(
        JSON.stringify({ error: 'Title and PDF file are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check file size
    const maxBytes = parseInt(Deno.env.get('UPLOAD_MAX_BYTES') || '104857600') // 100MB default
    if (pdfFile.size > maxBytes) {
      return new Response(
        JSON.stringify({ error: 'PDF file too large' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (coverFile && coverFile.size > maxBytes) {
      return new Response(
        JSON.stringify({ error: 'Cover image too large' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file types
    if (pdfFile.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'Invalid file type for PDF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (coverFile && !['image/jpeg', 'image/png', 'image/webp'].includes(coverFile.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type for cover image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create book record first to get ID
    const bookId = crypto.randomUUID()
    
    // Count PDF pages
    let pages = null
    try {
      const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer())
      const pdfDoc = await create({ data: pdfBytes })
      pages = pdfDoc.getPages().length
    } catch (error) {
      console.error('Error counting PDF pages:', error)
    }

    // Generate keywords from title and subject
    const keywords = []
    if (title) keywords.push(...title.toLowerCase().split(' ').filter(w => w.length > 2))
    if (subject) keywords.push(...subject.toLowerCase().split(' ').filter(w => w.length > 2))
    const uniqueKeywords = [...new Set(keywords)]

    // Upload files to storage
    const pdfPath = `books/${bookId}/pdf/${pdfFile.name}`
    const coverPath = coverFile ? `books/${bookId}/cover/${coverFile.name}` : null

    try {
      // Upload PDF
      const { error: pdfError } = await supabase.storage
        .from('books')
        .upload(pdfPath, pdfFile, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (pdfError) throw pdfError

      // Upload cover if provided
      if (coverFile) {
        const { error: coverError } = await supabase.storage
          .from('books')
          .upload(coverPath!, coverFile, {
            contentType: coverFile.type,
            upsert: false
          })

        if (coverError) throw coverError
      }

      // Create signed URLs (24 hour expiry)
      const { data: pdfSignedUrl } = await supabase.storage
        .from('books')
        .createSignedUrl(pdfPath, 86400) // 24 hours

      let coverSignedUrl = null
      if (coverPath) {
        const { data: coverUrlData } = await supabase.storage
          .from('books')
          .createSignedUrl(coverPath, 86400)
        coverSignedUrl = coverUrlData?.signedUrl
      }

      // Insert book record
      const { data: book, error: insertError } = await supabase
        .from('books')
        .insert({
          id: bookId,
          title,
          author: author || null,
          subject: subject || null,
          level: level || null,
          class_level: class_level || null,
          description: description || null,
          cover_url: coverSignedUrl,
          file_path: pdfSignedUrl?.signedUrl,
          pages,
          featured: featured || false,
          keywords: uniqueKeywords,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Create audit log
      await supabase
        .from('book_changes')
        .insert({
          book_id: bookId,
          admin_id: user.id,
          action: 'create',
          changes: {
            title,
            author,
            subject,
            level,
            class_level,
            description,
            featured,
            pages,
            keywords: uniqueKeywords,
          }
        })

      return new Response(
        JSON.stringify({ success: true, book }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Upload error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
