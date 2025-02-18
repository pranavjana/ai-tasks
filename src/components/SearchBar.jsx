import { useState } from 'react';
import Button from './Button';
import { ArrowRight, Loader2 } from 'lucide-react';

const SearchBar = ({ onSearch, loading }) => {
  const [input, setInput] = useState('');
  const hasInput = input.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasInput && !loading) {
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
          className="w-full h-[44px] px-4 pr-14 bg-neutral-800 text-white rounded-lg focus:outline-none placeholder:text-neutral-500 caret-purple-400"
          disabled={loading}
        />
        <div className="absolute right-2">
          <Button 
            variant="send" 
            size="icon"
            onClick={hasInput && !loading ? handleSubmit : undefined}
            icon={loading ? 
              <Loader2 className="w-4 h-4 animate-spin" /> : 
              <ArrowRight className="w-4 h-4" />
            }
          />
        </div>
      </div>
    </form>
  );
};

export default SearchBar; 