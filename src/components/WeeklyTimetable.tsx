import React, { useMemo } from "react";

interface ScheduleItem {
    courseName: string;
    courseCode: string;
    lectureDate: string; // "DD/MM/YYYY"
    dateTime: string;    // "DD/MM/YYYY : HH:MM AM - HH:MM PM"
    roomName?: string;
}

interface WeeklyTimetableProps {
    scheduleData: ScheduleItem[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyTimetable({ scheduleData }: WeeklyTimetableProps) {
    // 1. Process data into a grid structure
    const { timeSlots, grid } = useMemo(() => {
        const slots = new Set<string>();
        const gridData: Record<string, Record<string, ScheduleItem[]>> = {};

        // Initialize grid
        DAYS.forEach(day => {
            gridData[day] = {};
        });

        scheduleData.forEach(item => {
            // Parse Date to get Day Name
            const [dayPart, monthPart, yearPart] = (item.lectureDate || "").split('/');
            if (!dayPart || !monthPart || !yearPart) return;

            const date = new Date(Number(yearPart), Number(monthPart) - 1, Number(dayPart));
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            // Parse Time Slot
            let timeSlot = item.dateTime || "";
            if (timeSlot.includes(':')) {
                const parts = timeSlot.split(':');
                // "01/12/2025 : 02:20 PM - 03:10 PM" -> split by first colon might be tricky if date has no colon but time does.
                // Actually the format is "DD/MM/YYYY : HH:MM AM - HH:MM PM".
                // Let's split by " : "
                const splitParts = timeSlot.split(' : ');
                if (splitParts.length > 1) {
                    timeSlot = splitParts[1].trim();
                }
            }

            if (!timeSlot) return;

            slots.add(timeSlot);

            if (!gridData[dayName]) gridData[dayName] = {};
            if (!gridData[dayName][timeSlot]) gridData[dayName][timeSlot] = [];

            gridData[dayName][timeSlot].push(item);
        });

        // Sort time slots
        const sortedSlots = Array.from(slots).sort((a, b) => {
            // Simple AM/PM sort logic
            // Convert to 24h for comparison
            const to24 = (timeStr: string) => {
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return 0;
                const [, h, m, p] = match;
                let hour = parseInt(h);
                if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                if (p.toUpperCase() === 'AM' && hour === 12) hour = 0;
                return hour * 60 + parseInt(m);
            };
            return to24(a) - to24(b);
        });

        return { timeSlots: sortedSlots, grid: gridData };
    }, [scheduleData]);

    if (scheduleData.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                No schedule data available for this week.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-200">
                <thead>
                    <tr>
                        <th className="p-3 border border-slate-200 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 z-10 w-24">
                            Time
                        </th>
                        {DAYS.map(day => (
                            <th key={day} className="p-3 border border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[160px]">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(slot => (
                        <tr key={slot}>
                            <td className="p-3 border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 sticky left-0 z-10 whitespace-nowrap">
                                {slot}
                            </td>
                            {DAYS.map(day => {
                                const items = grid[day]?.[slot] || [];
                                return (
                                    <td key={`${day}-${slot}`} className="p-2 border border-slate-200 align-top h-24">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bg-blue-50 text-blue-900 p-2 rounded mb-1 border border-blue-100 text-xs">
                                                <div className="font-bold">{item.courseCode}</div>
                                                <div className="truncate" title={item.courseName}>{item.courseName}</div>
                                                {item.roomName && <div className="mt-1 text-[10px] text-blue-700 font-medium">📍 {item.roomName}</div>}
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
