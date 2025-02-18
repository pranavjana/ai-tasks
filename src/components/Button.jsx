import { cn } from '../lib/utils';

const Button = ({ children, variant = 'default', size = 'default', className, onClick, icon }) => {
  const baseStyles = 'inline-flex items-center justify-center transition-colors focus-visible:outline-none disabled:cursor-not-allowed';
  
  const variants = {
    default: 'bg-black text-white hover:bg-neutral-900 rounded-lg',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg',
    icon: 'text-neutral-400 hover:text-white rounded-lg',
    send: 'enabled:bg-violet-500 enabled:text-white disabled:bg-neutral-700 disabled:text-neutral-400 rounded-full'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-8 text-sm',
    icon: 'h-8 w-8'
  };

  return (
    <button
      type="submit"
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={onClick === undefined}
    >
      {icon ? (
        <span className="flex items-center justify-center w-full h-full">
          {icon}
        </span>
      ) : children}
    </button>
  );
};

export default Button; 