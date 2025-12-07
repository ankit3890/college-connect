"use client";

import React, { useMemo, useState, useEffect } from "react";

interface DaywiseEntry {
	date: string | null;
	day: string | null;
	timeSlot: string | null;
	status: string | null;
}

export default function CourseCalendar({
	courseName,
	componentName,
	entries,
	onClose,
}: {
	courseName?: string | null;
	componentName?: string | null;
	entries: DaywiseEntry[];
	onClose: () => void;
}) {
	// Helper function to extract start time from timeSlot for sorting
	function getStartTimeInMinutes(timeSlot: string | null): number {
		if (!timeSlot) return Infinity;
		// Extract first time from format like "09:10 AM - 10:00 AM"
		const match = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
		if (!match) return Infinity;
		let hours = parseInt(match[1], 10);
		const mins = parseInt(match[2], 10);
		const period = match[3].toUpperCase();
		if (period === 'PM' && hours !== 12) hours += 12;
		if (period === 'AM' && hours === 12) hours = 0;
		return hours * 60 + mins;
	}

	// Normalize entries into a map by YYYY-MM-DD, sorted by time
	const mapByDate = useMemo(() => {
		const m: Record<string, DaywiseEntry[]> = {};
		entries.forEach((e) => {
			if (!e.date) return;
			const d = new Date(e.date);
			if (isNaN(d.getTime())) return;
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			m[key] = m[key] || [];
			m[key].push(e);
		});
		// Sort entries by start time for each day
		Object.keys(m).forEach((key) => {
			m[key].sort((a, b) => getStartTimeInMinutes(a.timeSlot) - getStartTimeInMinutes(b.timeSlot));
		});
		return m;
	}, [entries]);

	// Compute an initial month to show: choose the entry date (past or future)
	// that is nearest to today. This ensures the calendar opens on a month with
	// actual or scheduled entries instead of always showing the current month.
	const initialMonth = useMemo(() => {
		const today = new Date();
		const validDates: Date[] = entries
			.map((e) => {
				if (!e || !e.date) return null;
				const d = new Date(e.date);
				if (isNaN(d.getTime())) return null;
				return d;
			})
			.filter((d): d is Date => d !== null);

		if (!validDates.length) return new Date(today.getFullYear(), today.getMonth(), 1);

		let best = validDates[0];
		let bestDiff = Math.abs(validDates[0].getTime() - today.getTime());
		for (let i = 1; i < validDates.length; i++) {
			const diff = Math.abs(validDates[i].getTime() - today.getTime());
			if (diff < bestDiff) {
				best = validDates[i];
				bestDiff = diff;
			}
		}

		return new Date(best.getFullYear(), best.getMonth(), 1);
	}, [entries]);

	const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

	useEffect(() => {
		setCurrentMonth(initialMonth);
	}, [initialMonth]);

	function prevMonth() {
		const d = new Date(currentMonth);
		d.setMonth(d.getMonth() - 1);
		setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
	}

	function nextMonth() {
		const d = new Date(currentMonth);
		d.setMonth(d.getMonth() + 1);
		setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
	}

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	function dateKey(d: number) {
		return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
	}

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="max-w-4xl w-full h-5/6 bg-white rounded-2xl shadow-lg p-4 sm:p-5 flex flex-col">
				<div className="flex items-center justify-between mb-3 flex-shrink-0">
					<div className="flex items-center gap-2">
						<button onClick={prevMonth} className="px-2 py-1 rounded border">◀</button>
						<div className="text-sm font-medium">{monthNames[month]} {year}</div>
						<button onClick={nextMonth} className="px-2 py-1 rounded border">▶</button>
					</div>
					<div className="text-xs text-slate-500">{courseName || 'Course'} · {componentName || 'Component'}</div>
					<button onClick={onClose} className="text-red-500 font-bold">✕</button>
				</div>

				<div className="overflow-y-auto flex-1">
					<div className="grid grid-cols-7 gap-0.5 text-[10px] mb-1 sticky top-0 bg-white">
						{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
							<div key={d} className="text-slate-500 text-center font-medium text-[9px]">{d}</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-0.5">
						{Array.from({ length: firstDay }).map((_, i) => (
							<div key={`empty-${i}`} className="min-h-[50px] p-0.5 border bg-slate-50" />
						))}				{Array.from({ length: daysInMonth }).map((_, idx) => {
							const d = idx + 1;
							const k = dateKey(d);
							const dayEntries = mapByDate[k] || [];
							return (
								<div key={k} className="min-h-[50px] p-0.5 border bg-white">
									<div className="text-xs font-medium mb-0.5">{d}</div>
									<div className="space-y-0.5 text-[9px]">
										{dayEntries.length === 0 ? (
											<div className="text-slate-400 text-[7px]">No classes</div>
										) : (
											dayEntries.map((e, i2: number) => {
												const status = (e.status ?? "").toString().toUpperCase();
												const isPresent = status === 'PRESENT' || status === 'P';
												const isAbsent = status === 'ABSENT' || status === 'A';
												const entryBgClass = isPresent ? 'bg-accent-100 border-l-4 border-accent' : isAbsent ? 'bg-danger-100 border-l-4 border-danger' : 'bg-slate-50';
												return (
													<div key={i2} className={`p-1 rounded ${entryBgClass}`} title={e.timeSlot ?? ''}>
														<div className="text-[7px] font-semibold leading-tight break-words max-w-[8rem] md:max-w-sm">{e.timeSlot ?? 'Class'}</div>
														<div className={`text-[6px] ${isPresent ? 'text-accent' : isAbsent ? 'text-danger' : 'text-slate-500'}`}>{isPresent ? 'Present' : isAbsent ? 'Absent' : (e.status ?? '')}</div>
													</div>
												);
											})
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="mt-3 flex gap-2 text-xs flex-shrink-0">
					<div className="flex items-center gap-1"><div className="w-4 h-4 bg-accent-100 border-l-4 border-accent"></div> Present</div>
					<div className="flex items-center gap-1"><div className="w-4 h-4 bg-danger-100 border-l-4 border-danger"></div> Absent</div>
				</div>
			</div>
		</div>
	);
}
