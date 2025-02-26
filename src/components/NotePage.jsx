import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { createPortal } from 'react-dom';

const NotePage = ({ subtask, onClose }) => {
  const [note, setNote] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing note if any
    const loadNote = async () => {
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
      }
    };

    loadNote();

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [subtask.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ notes: note })
        .eq('id', subtask.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-neutral-900 z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 backdrop-blur-sm bg-neutral-900/80 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-medium text-white mb-1">{subtask.content}</h2>
            <p className="text-sm text-neutral-400">Add notes or additional details</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-full p-4 bg-neutral-800/50 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-500"
            placeholder="Type your notes here..."
            autoFocus
          />
        </div>
      </div>
    </motion.div>
  );

  // Render the modal in a portal at the root level
  return createPortal(content, document.body);
};

export default NotePage; 