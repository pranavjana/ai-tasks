import { useState } from 'react';
import Button from './Button';
import { Mic, Send, Loader2 } from 'lucide-react';

const SearchBar = ({ onSearch, loading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSearch(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your task here... (e.g., remind me to wash my clothes every day)"
          className="w-full h-[44px] px-4 pr-24 bg-neutral-800 text-white rounded-lg focus:outline-none placeholder:text-neutral-500"
          disabled={loading}
        />
        <div className="absolute right-2 flex gap-2">
          <Button 
            variant="icon" 
            size="icon"
            type="button"
            onClick={() => console.log('Microphone clicked')}
            icon={<Mic className="w-4 h-4" />}
            disabled={loading}
          />
          <Button 
            variant="icon" 
            size="icon"
            type="submit"
            disabled={!input.trim() || loading}
            icon={loading ? 
              <Loader2 className="w-4 h-4 animate-spin" /> : 
              <Send className="w-4 h-4" />
            }
          />
        </div>
      </div>
    </form>
  );
};

export default SearchBar; 