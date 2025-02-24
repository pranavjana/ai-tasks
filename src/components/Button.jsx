import { cn } from '../lib/utils';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className,
  ...props 
}) => {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Variants
        variant === 'default' && [
          "bg-neutral-800 text-white hover:bg-neutral-700",
          "active:bg-neutral-600",
        ],
        variant === 'ghost' && [
          "hover:bg-neutral-800/50",
          "active:bg-neutral-800",
        ],
        variant === 'send' && [
          "bg-neutral-800 text-neutral-400",
          "hover:bg-neutral-700",
          "data-[active=true]:bg-purple-500/10 data-[active=true]:text-purple-400",
        ],
        
        // Sizes
        size === 'default' && "h-9 px-4 py-2",
        size === 'sm' && "h-8 px-3 rounded-md",
        size === 'lg' && "h-10 px-8 rounded-md",
        size === 'icon' && "h-9 w-9",
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 