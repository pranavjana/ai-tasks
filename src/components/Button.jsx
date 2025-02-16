import { cn } from '../lib/utils';

const Button = ({ children, variant = 'default', size = 'default', className, onClick, icon }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-black text-white hover:bg-neutral-900 border border-neutral-800',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-900',
    icon: 'h-8 w-8 p-0 bg-transparent text-neutral-400 hover:text-white'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-8',
    icon: 'h-8 w-8'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {variant !== 'icon' && children}
    </button>
  );
};

export default Button; 