import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// In server components, we need to access environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  
  // Remove requests outside the current window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(userId, recentRequests);
  return true;
};

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return Response.json({ error: 'Invalid audio format' }, { status: 400 });
    }

    // Transcribe audio using OpenAI's Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return Response.json({ text: transcription.text }, { status: 200 });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ error: 'Failed to transcribe audio: ' + error.message }, { status: 500 });
  }
} 