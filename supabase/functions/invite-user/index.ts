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
    console.log('Edge Function invoked')
    
    // Verify the request is from an authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No auth header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth header present')

    // Create regular client to verify user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://qwoabopuoihbawlwmgbf.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    console.log('Verifying calling user...')
    
    // Verify the calling user exists and is a super admin
    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !callingUser) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Unauthorized: Invalid token - ${authError?.message || 'No user'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User verified:', callingUser.id)

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', callingUser.id)
      .single()

    console.log('Profile check:', { profile, profileError })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ error: `Profile error: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile?.is_super_admin) {
      console.error('Not super admin:', profile)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Super admin verified')

    // Get request data
    const { email, fullName, password, role } = await req.json()

    console.log('Request data:', { email, fullName, role, passwordLength: password?.length })

    // Validate input
    if (!email || !fullName || !password || !role) {
      console.error('Missing fields:', { email: !!email, fullName: !!fullName, password: !!password, role: !!role })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      console.error('Password too short:', password.length)
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating admin client...')
    
    // Create Supabase admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qwoabopuoihbawlwmgbf.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      console.error('No service role key!')
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

    console.log('Checking for existing user...')
    
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email.toLowerCase())

    if (userExists) {
      console.error('User already exists:', email)
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating auth user...')
    
    // Create auth user with password
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    })

    if (createAuthError) {
      console.error('Auth user creation failed:', createAuthError)
      throw createAuthError
    }

    console.log('Auth user created:', authUser.user.id)
    console.log('Creating profile...')

    // Create profile record
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        role: role,
        status: 'active' // Active since admin created them
      }])

    if (insertProfileError) {
      console.error('Profile creation failed:', insertProfileError)
      throw insertProfileError
    }

    console.log('User created successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User created successfully! Email: ${email} | Password: ${password}`,
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
