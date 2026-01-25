import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    console.log('📨 Edge Function invoked')
    
    // Get request data
    const { email, fullName, password, role } = await req.json()

    console.log('📝 Request data:', { email, fullName, role })

    // Validate input
    if (!email || !fullName || !password || !role) {
      console.error('❌ Missing fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      console.error('❌ Password too short')
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Creating admin client...')
    
    // Create Supabase admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qwoabopuoihbawlwmgbf.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      console.error('❌ No service role key!')
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

    console.log('🔍 Checking for existing user...')
    
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email.toLowerCase())

    if (userExists) {
      console.error('❌ User already exists:', email)
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('👤 Creating auth user...')
    
    // Create auth user with password
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (userError) {
      console.error('❌ Auth user creation failed:', userError)
      throw userError
    }

    console.log('✅ Auth user created:', userData.user.id)
    console.log('📋 Creating profile...')

    // Create profile record
    const { error: profError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: userData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        role: role,
        status: 'active'
      }])

    if (profError) {
      console.error('❌ Profile creation failed:', profError)
      throw profError
    }

    console.log('🎉 User created successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User created successfully! Email: ${email} | Password: ${password}`,
        userId: userData.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('💥 Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
