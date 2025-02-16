import Button from './Button';
import { Mic, Send } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Type your message here..."
          className="w-full h-[44px] px-4 pr-24 bg-neutral-800 text-white rounded-lg focus:outline-none placeholder:text-neutral-500"
        />
        <div className="absolute right-2 flex gap-2">
          <Button 
            variant="icon" 
            size="icon"
            onClick={() => console.log('Microphone clicked')}
            icon={<Mic className="w-4 h-4" />}
          />
          <Button 
            variant="icon" 
            size="icon"
            onClick={() => console.log('Send clicked')}
            icon={<Send className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 