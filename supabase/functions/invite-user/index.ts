import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const { email, fullName, role } = await req.json()

    // Validate input
    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client with service role key
    // SUPABASE_URL is automatically provided by Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qwoabopuoihbawlwmgbf.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email.toLowerCase())

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user with admin API (sends magic link email automatically)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) throw authError

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        role: role,
        status: 'active' // Active since admin created them
      }])

    if (profileError) throw profileError

    // Send password reset email so they can set their password
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email.toLowerCase(),
      {
        redirectTo: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/reset-password`
      }
    )

    if (resetError) {
      console.error('Password reset email error:', resetError)
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User created successfully. ${fullName} will receive an email to set their password.`,
        userId: authUser.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
