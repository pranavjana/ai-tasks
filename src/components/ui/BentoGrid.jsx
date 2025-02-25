import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />
);

export const BentoGrid = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  colSpan = 1,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50",
        colSpan === 2 && "md:col-span-2",
        className
      )}
    >
      {header && (
        <div className="mb-4">
          {header}
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <div className="p-2 w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-neutral-700/20 via-transparent to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity rounded-xl" />
    </motion.div>
  );
}; 