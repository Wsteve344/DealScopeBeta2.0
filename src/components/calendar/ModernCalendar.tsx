import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Props {
  onDateSelect?: (date: Date) => void;
  onAddEvent?: () => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
}

const ModernCalendar: React.FC<Props> = ({
  onDateSelect,
  onAddEvent,
  selectedDate,
  minDate,
  maxDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const newMonth = direction === 'next' 
      ? addMonths(currentMonth, 1)
      : subMonths(currentMonth, 1);

    // Check if new month is within bounds
    if (minDate && startOfMonth(newMonth) < startOfMonth(minDate)) return;
    if (maxDate && endOfMonth(newMonth) > endOfMonth(maxDate)) return;

    setCurrentMonth(newMonth);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        handleMonthChange('next');
      } else {
        handleMonthChange('prev');
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDateClick(date);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => handleMonthChange('prev')}
          >
            <ChevronLeft className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div 
            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => handleMonthChange('next')}
          >
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>

        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div 
            key={day} 
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div 
        className={`grid grid-cols-7 gap-1 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="p-2" />
        ))}

        {days.map((day, index) => {
          const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => !isDisabled && handleDateClick(day)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, day)}
              className={`
                p-2 text-center rounded-full cursor-pointer transition-all
                hover:bg-blue-50 hover:text-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                ${isCurrentDay ? 'font-bold' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}

        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="p-2" />
        ))}
      </div>
    </div>
  );
};

export default ModernCalendar;