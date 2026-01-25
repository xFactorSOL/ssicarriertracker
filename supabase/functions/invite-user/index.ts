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
    
    // Verify the request is from an authenticated super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No auth header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client to verify user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !callingUser) {
      console.error('❌ Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', callingUser.id)

    // Check if user is super admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', callingUser.id)
      .single()

    if (!profile?.is_super_admin) {
      console.error('❌ Not super admin')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Super admin verified')
    
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
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      console.error('❌ Auth user creation failed:', createError)
      throw createError
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
      JSON.stringify({ 
        error: err.message || 'Unknown error occurred',
        details: err.toString() 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
