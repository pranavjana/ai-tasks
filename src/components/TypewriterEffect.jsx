import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const TypewriterEffect = ({ text, className }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15); // Made it twice as fast (was 30ms)

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className={className}>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.3, // Made the cursor blink faster (was 0.5)
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="inline-block w-[2px] h-4 ml-1 bg-white"
        />
      )}
    </div>
  );
};

export default TypewriterEffect; 