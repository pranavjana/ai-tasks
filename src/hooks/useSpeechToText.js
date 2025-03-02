'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for speech-to-text functionality
 * @returns {Object} - Speech-to-text methods and state
 */
export const useSpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      // Reset error state
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // Configure recorder
      const options = {
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm'
      };

      // Create and configure recorder
      const recorder = new MediaRecorder(stream, options);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      // Handle data available events
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data]);
        }
      };

      // Start recording
      recorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (err) {
      const errorMessage = `Error accessing microphone: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage, err);
    }
  }, []);

  /**
   * Stop recording and transcribe audio
   * @returns {Promise<string>} - Transcribed text
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorder) return '';

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        try {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          // Check if the audio is too short
          if (audioBlob.size < 1000) {
            throw new Error('Recording too short');
          }
          
          // Create form data for API request
          const formData = new FormData();
          const audioFile = new File([audioBlob], 'recording.webm', { 
            type: 'audio/webm',
            lastModified: Date.now()
          });
          formData.append('audio', audioFile);

          // Get authentication session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            throw new Error('Authentication required');
          }

          // Send transcription request
          console.log('Sending transcription request...');
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          console.log('Transcription response status:', response.status);
          
          // Parse response
          const responseText = await response.text();
          let responseData;
          
          try {
            responseData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Failed to parse response:', parseError.message);
            
            if (responseText.includes('<!DOCTYPE html>')) {
              throw new Error('Server returned HTML instead of JSON. Check server logs.');
            } else {
              throw new Error('Invalid JSON response from server');
            }
          }

          // Handle error responses
          if (!response.ok) {
            throw new Error(responseData.error || `Server error: ${response.status}`);
          }

          // Return transcribed text
          resolve(responseData.text || '');
        } catch (err) {
          const errorMessage = `Error transcribing audio: ${err.message}`;
          setError(errorMessage);
          console.error(errorMessage, err);
          resolve('');
        } finally {
          // Clean up resources
          if (mediaRecorder && mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
          setIsRecording(false);
          setAudioChunks([]);
        }
      };

      // Stop recording
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
