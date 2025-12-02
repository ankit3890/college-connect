"use client";

import React, { useMemo } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, TooltipItem, ChartEvent, ActiveElement, ChartOptions } from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface AttendanceCourse {
  courseCode: string;
  courseName: string;
  componentName: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

interface AttendanceGraphProps {
  courses: AttendanceCourse[];
  onOpenDaywise?: (course: AttendanceCourse) => void; // optional click handler
}

export default function AttendanceGraph({ courses, onOpenDaywise }: AttendanceGraphProps) {
  // Data for Bar Chart (Present vs Absent by Course)
  const barChartData = useMemo(() => {
    const labels = courses.map((c) => c.courseName.substring(0, 20)); // Truncate long names
    const presentData = courses.map((c) => c.presentClasses);
    const absentData = courses.map((c) => Math.max(c.totalClasses - c.presentClasses, 0));
    // present always green, absent always red for clarity
    const presentColors = courses.map(() => "#10b981");
    const absentColors = courses.map(() => "#ef4444");

    return {
      labels,
      datasets: [
        {
          label: "Present",
          data: presentData,
          backgroundColor: presentColors,
          borderColor: presentColors.map((c) => c),
          borderWidth: 1,
        },
        {
          label: "Absent",
          data: absentData,
          backgroundColor: absentColors,
          borderColor: absentColors.map((c) => c),
          borderWidth: 1,
        },
      ],
    };
  }, [courses]);

  // Data for Doughnut Chart (Overall Attendance Percentage)
  const overallStats = useMemo(() => {
    const totalPresent = courses.reduce((sum, c) => sum + c.presentClasses, 0);
    const totalAbsent = courses.reduce((sum, c) => sum + Math.max(c.totalClasses - c.presentClasses, 0), 0);

    return {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [totalPresent, totalAbsent],
          backgroundColor: ["#10b981", "#ef4444"],
          borderColor: ["#059669", "#dc2626"],
          borderWidth: 2,
        },
      ],
    };
  }, [courses]);

  // Data for Line Chart (Attendance Percentage by Course)
  const lineChartData = useMemo(() => {
    const labels = courses.map((c) => c.courseName.substring(0, 15));
    const percentageData = courses.map((c) => c.percentage);
    const targetLine = new Array(courses.length).fill(75);

    return {
      labels,
      datasets: [
        {
          label: "Target (%)",
          data: targetLine,
          borderColor: "#f59e0b",
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [6, 6],
          fill: false,
          tension: 0,
        },
        {
          label: "Attendance %",
          data: percentageData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [courses]);

  const chartOptions: ChartOptions = {
    animation: false, // Disable animation for print reliability
    responsive: true,
    // allow the container to control aspect ratio for better responsiveness
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          title: function (context: TooltipItem<'bar' | 'line' | 'doughnut'>[]) {
            const item = context[0];
            // If this is the overall doughnut chart (Present/Absent), show the label directly
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chart = item?.chart as any;
            const chartType = chart?.config?.type;
            if (chartType === "doughnut" || (item?.chart?.data?.labels?.length && item?.chart?.data?.labels.length <= 2)) {
              return item?.label ?? "";
            }
            const idx = item?.dataIndex ?? 0;
            const course = courses[idx];
            return course ? `${course.courseCode || course.courseName} · ${course.componentName}` : item?.label;
          },
          label: function (context: TooltipItem<'bar' | 'line' | 'doughnut'>) {
            const datasetLabel = context.dataset && context.dataset.label ? context.dataset.label : "Value";
            const value = context.parsed?.y ?? context.raw ?? 0;
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
  };

  if (courses.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500">
        No courses available to display graphs
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Attendance Summary */}
      <div className="bg-white border rounded-lg p-4 print:break-inside-avoid">
        <h3 className="text-sm font-semibold mb-4">Overall Attendance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="max-w-xs mx-auto print:hidden">
            {/* Doughnut: disable legend click (so users can't hide Present/Absent) and use chartOptions */}
            {(() => {
              const doughnutOptions: ChartOptions<'doughnut'> = {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    onClick: () => { },
                  },
                  tooltip: chartOptions.plugins?.tooltip,
                },
              };

              return <Doughnut data={overallStats} options={doughnutOptions} />;
            })()}
          </div>
          <div className="md:col-span-2 flex flex-col justify-center print:col-span-1">
            {(() => {
              const totalPresent = courses.reduce((sum, c) => sum + c.presentClasses, 0);
              const totalAbsent = courses.reduce((sum, c) => sum + Math.max(c.totalClasses - c.presentClasses, 0), 0);
              const total = totalPresent + totalAbsent;
              const overallPercent = total > 0 ? parseFloat(((totalPresent / total) * 100).toFixed(1)) : 0;

              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Classes:</span>
                    <span>{total}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-semibold">Present:</span>
                    <span>{totalPresent}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="font-semibold">Absent:</span>
                    <span>{totalAbsent}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Overall %:</span>
                    <span className={overallPercent >= 75 ? "text-emerald-600" : "text-red-600"}>{overallPercent}%</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bar Chart - Present vs Absent */}
      <div className="bg-white border rounded-lg p-4 print:break-inside-avoid">
        <h3 className="text-sm font-semibold mb-4">Present vs Absent by Course</h3>
        <div className="max-h-96 cursor-pointer" style={{ height: 420 }}>
          <Bar
            data={barChartData}
            options={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(chartOptions as any),
              scales: { y: { beginAtZero: true } },
              onClick: (evt: ChartEvent, elements: ActiveElement[]) => {
                if (!elements || !elements.length) return;
                const first = elements[0];
                // element.index is the item index
                const idx = first.index;
                if (typeof onOpenDaywise === "function") {
                  onOpenDaywise(courses[idx]);
                }
              },
            }}
          />
        </div>
      </div>

      {/* Line Chart - Attendance Percentage */}
      <div className="bg-white border rounded-lg p-4 print:break-inside-avoid">
        <h3 className="text-sm font-semibold mb-4">Attendance Percentage by Course</h3>
        <div className="max-h-96">
          <div style={{ height: 320 }} className={onOpenDaywise ? "cursor-pointer" : ""}>
            <Line
              data={lineChartData}
              options={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(chartOptions as any), scales: { y: { beginAtZero: true, max: 100 } },
                onClick: (evt: ChartEvent, elements: ActiveElement[]) => {
                  if (!elements || !elements.length) return;
                  const first = elements[0];
                  const idx = first.index;
                  if (typeof onOpenDaywise === "function") {
                    onOpenDaywise(courses[idx]);
                  }
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Course Comparison Table */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Course-wise Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Course</th>
                <th className="px-3 py-2 text-right font-semibold">Present</th>
                <th className="px-3 py-2 text-right font-semibold">Absent</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) => {
                const absent = Math.max(course.totalClasses - course.presentClasses, 0);
                return (
                  <tr key={idx} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{course.courseName}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-semibold">{course.presentClasses}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-semibold">{absent}</td>
                    <td className="px-3 py-2 text-right">{course.totalClasses}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${course.percentage >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                      {course.percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
