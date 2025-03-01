import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      const options = {
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm'
      };

      const recorder = new MediaRecorder(stream, options);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data]);
        }
      };

      recorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder) return;

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          // Check if the audio is too short (less than 0.5 seconds)
          if (audioBlob.size < 1000) {
            throw new Error('Recording too short');
          }
          
          const formData = new FormData();
          
          // Create a File object with .webm extension
          const audioFile = new File([audioBlob], 'recording.webm', { 
            type: 'audio/webm',
            lastModified: Date.now()
          });
          
          formData.append('audio', audioFile);

          // Get the session for authentication
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            throw new Error('Authentication required');
          }

          // Log the request details for debugging
          console.log('Sending transcription request with token:', session.access_token.substring(0, 10) + '...');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          // Log the response status for debugging
          console.log('Transcription response status:', response.status);
          
          let responseData;
          const responseText = await response.text();
          
          // Log the raw response for debugging
          console.log('Transcription raw response:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
          
          try {
            // Try to parse the response as JSON
            responseData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Failed to parse response:', parseError.message);
            
            // Check if the response contains HTML (likely an error page)
            if (responseText.includes('<!DOCTYPE html>')) {
              throw new Error('Server returned HTML instead of JSON. Check server logs.');
            } else {
              throw new Error('Invalid JSON response from server');
            }
          }

          if (!response.ok) {
            throw new Error(responseData.error || `Server error: ${response.status}`);
          }

          resolve(responseData.text || '');
        } catch (err) {
          const errorMessage = 'Error transcribing audio: ' + err.message;
          setError(errorMessage);
          console.error(errorMessage, err);
          resolve('');
        } finally {
          // Clean up
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setAudioChunks([]);
        }
      };

      mediaRecorder.stop();
    });
  }, [mediaRecorder, audioChunks]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording
  };
}; 
