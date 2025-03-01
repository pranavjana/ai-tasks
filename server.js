import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.server
dotenv.config({ path: '.env.server' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer to handle webm files
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.webm`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only webm files
    if (file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only webm files are allowed'));
    }
  }
});

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(userId, recentRequests);
  return true;
};

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  let filePath = null;
  
  try {
    // Get user from Supabase auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    filePath = req.file.path;

    // Transcribe audio using OpenAI's Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: 'json',
      language: 'en'
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  } finally {
    // Clean up temporary file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
  });
}); 
