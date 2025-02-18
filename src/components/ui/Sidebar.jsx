import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const Sidebar = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarBody = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col bg-neutral-800 border-r border-neutral-800 w-[60px] transition-all duration-300",
          open && "w-[300px]",
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center h-12 border-t border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <div className="h-14 px-4 py-4 flex items-center justify-between bg-black w-full border-b border-neutral-800">
          <div className="flex justify-end z-20 w-full">
            <Menu
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setOpen(!open)}
            />
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "fixed h-full w-full inset-0 bg-black p-6 z-[100] flex flex-col",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setOpen(false)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({ link, className, ...props }) => {
  const { open } = useSidebar();
  
  const handleClick = (e) => {
    e.preventDefault();
    if (link.onClick) link.onClick(e);
  };

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center transition-all rounded-lg",
        open ? "gap-3 px-2" : "justify-center",
        "py-2 text-neutral-400 hover:text-white hover:bg-neutral-700",
        link.active && "bg-neutral-800 text-white",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="w-4 h-4 flex-shrink-0">
        {link.icon}
      </div>
      {open && (
        <span className="text-sm whitespace-pre">
          {link.label}
        </span>
      )}
    </a>
  );
}; 