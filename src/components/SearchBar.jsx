import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { ArrowRight, Loader2, Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { cn } from '../lib/utils';

const SearchBar = ({ onSearch, loading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const hasInput = input.trim().length > 0;
  const { isRecording, error, startRecording, stopRecording } = useSpeechToText();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasInput && !loading) {
      onSearch(input.trim());
      setInput('');
      // Reset height after submission
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setInput((prev) => prev + (prev ? ' ' : '') + transcribedText);
        adjustTextareaHeight();
      }
    } else {
      await startRecording();
    }
  };

  // Adjust height on initial render
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-start">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your task here... (e.g., remind me to wash my clothes every day)"
          className="w-full min-h-[44px] max-h-[200px] px-4 py-2.5 pr-24 bg-neutral-800 text-white rounded-lg focus:outline-none placeholder:text-neutral-500 caret-purple-400 resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent"
          disabled={loading || isRecording}
        />
        <div className="absolute right-2 top-1.5 flex gap-2">
          <Button
            variant="send"
            size="icon"
            onClick={toggleRecording}
            disabled={loading}
            className={cn(
              "transition-colors duration-200",
              isRecording && "bg-red-500 hover:bg-red-600"
            )}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button 
            variant="send" 
            size="icon"
            onClick={hasInput && !loading ? handleSubmit : undefined}
            data-active={hasInput}
            className="transition-colors duration-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </form>
  );
};

export default SearchBar; 