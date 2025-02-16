import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const TimeSlot = ({ time }) => (
  <div className="flex items-center h-14">
    <div className="w-20 pr-4 text-xs text-neutral-500 text-right">
      {time}
    </div>
  </div>
);

const Event = ({ event, top, height }) => (
  <div
    className="absolute rounded px-2 py-1 overflow-hidden mx-1"
    style={{
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: event.color || 'rgb(55, 90, 127)',
      left: `calc(${(event.dayIndex * (100/7))}% + 80px)`,
      width: `calc(${100/7}% - 8px)`,
    }}
  >
    <div className="text-xs font-medium text-white">{event.title}</div>
    <div className="text-[10px] text-white/80">{event.time}</div>
  </div>
);

const WeekHeader = ({ date }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDate = new Date();
  
  // Get Monday of the current week
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  
  const weekDates = days.map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });

  return (
    <div className="flex border-b border-neutral-800">
      <div className="w-20" /> {/* Spacer for time column */}
      <div className="grid grid-cols-7 flex-1 mx-4">
        {weekDates.map((date, index) => (
          <div key={index} className="text-center py-2 border-l border-neutral-800 first:border-l-0">
            <div className="text-xs text-neutral-400">{days[index]}</div>
            <div className={`text-sm ${
              date.getDate() === currentDate.getDate() && 
              date.getMonth() === currentDate.getMonth() ? 
              'text-white font-medium' : 'text-neutral-500'
            }`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="w-4" /> {/* Right margin spacer */}
    </div>
  );
};

const DayView = ({ events = [], date }) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${ampm}`;
  });

  return (
    <div className="relative bg-[#1a1a1a]">
      <div className="relative flex">
        <div className="flex flex-col">
          {timeSlots.map((time) => (
            <TimeSlot key={time} time={time} />
          ))}
        </div>
        <div className="flex-1 mx-4">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-7 h-14 border-t border-neutral-800/50">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="border-l border-neutral-800/30 first:border-l-0" />
              ))}
            </div>
          ))}
          {events.map((event, index) => (
            <Event
              key={index}
              event={event}
              top={event.startHour * 56}
              height={event.duration * 56}
            />
          ))}
        </div>
        <div className="w-4" /> {/* Right margin spacer */}
      </div>

      {/* Current time indicator */}
      <motion.div
        className="absolute left-20 right-4 border-t border-blue-400 z-10"
        style={{
          top: `${(new Date().getHours() * 56) + ((new Date().getMinutes() / 60) * 56)}px`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    </div>
  );
};

const Timeline = ({ events = [] }) => {
  const [date, setDate] = useState(new Date());

  const navigateDate = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction * 7));
    setDate(newDate);
  };

  return (
    <div className="w-full max-w-5xl bg-[#1a1a1a] overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white">
            {date.toLocaleDateString('en-US', { 
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <div className="flex gap-1">
            <button 
              className="p-1 rounded-md text-neutral-400 hover:bg-neutral-800"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              className="p-1 rounded-md text-neutral-400 hover:bg-neutral-800"
              onClick={() => navigateDate(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Header */}
      <WeekHeader date={date} />

      {/* View Content */}
      <div className="h-[728px] overflow-y-auto">
        <DayView events={events} date={date} />
      </div>
    </div>
  );
};

export default Timeline; 