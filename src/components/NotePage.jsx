import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';

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

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed inset-0 bg-neutral-900 z-50 border-l border-neutral-800"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-lg font-medium text-white">{subtask.content}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
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
        <div className="flex-1 p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-full p-4 bg-neutral-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-700"
            placeholder="Type your notes here..."
          />
        </div>
      </div>
    </motion.div>
  );
};

export default NotePage; 