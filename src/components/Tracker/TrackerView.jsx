import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function TrackerView({ items }) {
    // 1. Calculate Category Totals (Needs/Wants/Savings)
    const categories = { needs: 0, wants: 0, savings: 0, spending: 0, debt: 0 };
    items.forEach(item => {
        if (categories[item.category] !== undefined) {
            categories[item.category] += item.amount;
        }
    });

    // Determine which rule is active based on what data we have
    // (Simple heuristic: if 'needs' > 0, we are likely in 50/30/20)
    let chartData = [];
    let chartLabels = [];
    let chartColors = [];

    if (categories.needs > 0 || categories.wants > 0) {
        chartLabels = ['Needs', 'Wants', 'Savings'];
        chartData = [categories.needs, categories.wants, categories.savings];
        chartColors = ['#22c55e', '#3b82f6', '#a855f7'];
    } else {
        // Fallback or 80/20
        chartLabels = ['Spending', 'Savings'];
        chartData = [categories.spending, categories.savings];
        chartColors = ['#6b7280', '#a855f7'];
    }

    const doughnutData = {
        labels: chartLabels,
        datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            borderWidth: 2,
        }],
    };

    // 2. Calculate Weekly Spending
    const weeklyData = [0, 0, 0, 0, 0];
    items.forEach(item => {
        if (!item.date) return;
        const day = new Date(item.date).getDate();
        if (day <= 7) weeklyData[0] += item.amount;
        else if (day <= 14) weeklyData[1] += item.amount;
        else if (day <= 21) weeklyData[2] += item.amount;
        else if (day <= 28) weeklyData[3] += item.amount;
        else weeklyData[4] += item.amount;
    });

    const barData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5+'],
        datasets: [{
            label: 'Weekly Spending',
            data: weeklyData,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af' } }
        },
        scales: {
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
        }
    };

    // Calculate Total Expense
    const totalExpense = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col: Stats & Bar Chart */}
            <div className="space-y-8">
                <div className="glass-card p-6">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold tracking-wider mb-1">Total Monthly Outflow</h3>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${totalExpense.toFixed(2)}</p>
                </div>
                
                <div className="glass-card p-6 h-80">
                    <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Weekly Breakdown</h3>
                    <div className="h-64">
                        <Bar data={barData} options={options} />
                    </div>
                </div>
            </div>

            {/* Right Col: Doughnut & Top Expenses */}
            <div className="space-y-8">
                <div className="glass-card p-6 h-80">
                    <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Spending Categories</h3>
                    <div className="h-64 relative">
                        <Doughnut data={doughnutData} options={{...options, scales:{}}} />
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Top Expenses</h3>
                    <ul className="space-y-3">
                        {items
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 5)
                            .map(item => (
                                <li key={item.id} className="flex justify-between items-center text-sm border-b dark:border-gray-700 pb-2 last:border-0">
                                    <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                    <span className="font-bold dark:text-white">${item.amount.toFixed(2)}</span>
                                </li>
                            ))}
                        {items.length === 0 && <li className="text-gray-500 text-center">No expenses yet</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}