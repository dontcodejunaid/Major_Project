import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, RotateCcw, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CustomDatePicker = ({ value, onChange, placeholder = "Select date...", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial selected date or default to current date view
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  
  const containerRef = useRef(null);

  // Sync internal view month/year if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar matrix calculation
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, '0');
    const da = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${da}`;
    setCurrentYear(yr);
    setCurrentMonth(today.getMonth());
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Format value for display button
  const getFormattedDisplay = () => {
    if (!value) return placeholder;
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const todayDate = new Date();
  const isTodaySelected = (day) => {
    return (
      todayDate.getDate() === day &&
      todayDate.getMonth() === currentMonth &&
      todayDate.getFullYear() === currentYear
    );
  };

  const isSelectedDate = (day) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return (
      d.getDate() === day &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  };

  // Generate days cells array
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      key: `prev-${i}`
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      day,
      isCurrentMonth: true,
      key: `curr-${day}`
    });
  }

  // Next month leading days to fill grid (42 cells = 6 rows)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      key: `next-${i}`
    });
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl glass-input text-xs font-semibold cursor-pointer select-none transition hover:border-violet-500/50 group shadow-sm"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
        <span className={value ? "font-mono" : "text-gray-400 font-sans"}>
          {getFormattedDisplay()}
        </span>
        {value ? (
          <button
            onClick={handleClear}
            className="ml-1 p-0.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </div>

      {/* Calendar Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl glass-panel p-3.5 shadow-2xl border border-violet-500/30 animate-fade-in no-print backdrop-blur-xl">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold tracking-wide">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-bold text-violet-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell) => {
              if (!cell.isCurrentMonth) {
                return (
                  <span
                    key={cell.key}
                    className="text-[11px] py-1.5 text-gray-600 cursor-not-allowed select-none opacity-40"
                  >
                    {cell.day}
                  </span>
                );
              }

              const selected = isSelectedDate(cell.day);
              const today = isTodaySelected(cell.day);

              return (
                <button
                  key={cell.key}
                  onClick={() => handleSelectDay(cell.day)}
                  className={`text-[11px] font-medium py-1.5 rounded-lg transition duration-150 cursor-pointer relative ${
                    selected
                      ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/40 scale-105'
                      : today
                      ? 'border border-violet-500/60 text-violet-400 font-bold bg-violet-500/10 hover:bg-violet-600/30'
                      : 'hover:bg-violet-500/15 hover:text-violet-400'
                  }`}
                >
                  {cell.day}
                  {today && !selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Action Footer */}
          <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-white/10 text-[11px] font-bold">
            <button
              onClick={handleSelectToday}
              className="text-violet-400 hover:text-violet-300 transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Today
            </button>

            {value && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
