import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TiptapEditor from './TiptapEditor';
import { createPortal } from 'react-dom';

export const NotePage = ({
  subtask = null,
  onClose = () => {}
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadExistingNote();
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add escape key listener to close notes
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseClick();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      setMounted(false);
    };
  }, []);

  const loadExistingNote = async () => {
    if (!subtask?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('notes')
        .eq('id', subtask.id)
        .single();

      if (error) throw error;
      if (data) {
        setNote(data.notes || '');
      }
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!subtask?.id) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ notes: note })
        .eq('id', subtask.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleNoteChange = (html) => {
    setNote(html);
  };

  const handleCloseClick = () => {
    saveNote();
    onClose();
  };

  const content = (
    <motion.div
      className="fixed inset-0 z-[9999] bg-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      ref={pageRef}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="flex flex-col h-full max-w-full">
        <div className="w-full border-b border-neutral-800">
          <div className="flex justify-between items-center py-4 px-6">
            <h2 className="text-xl font-semibold text-white">
              {subtask?.title ? `Notes for: ${subtask.title}` : 'New Note'}
            </h2>
            <button
              onClick={handleCloseClick}
              className="text-neutral-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-400"></div>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto h-full">
              <TiptapEditor 
                content={note} 
                onUpdate={handleNoteChange} 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Only render in browser, not during SSR
  if (!mounted) return null;
  
  // Use createPortal to render at the root level of the DOM
  return createPortal(content, document.body);
};

export default NotePage; 