import type { IndexHistory } from '$lib/types';

function generateMockData(): IndexHistory {
    const data: IndexHistory = {
        SP500: [],
        DOW: []
    };

    // Generate data for the last year
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    // Starting values from a year ago
    let sp500Value = 4200; // S&P 500 value from a year ago
    let dowValue = 33000; // Dow value from a year ago

    // Target 20% annual growth
    const targetAnnualGrowth = 0.20;
    const dailyGrowthSP500 = Math.pow(1 + targetAnnualGrowth, 1/252) - 1; // 252 trading days
    const dailyGrowthDOW = dailyGrowthSP500 * 0.95; // Slightly lower for diversification

    // Key events to simulate (dates and impacts)
    const events = [
        { month: 2, impact: -0.04 }, // Market correction
        { month: 5, impact: 0.06 },  // Strong earnings season
        { month: 8, impact: -0.03 }, // Economic concerns
        { month: 11, impact: 0.05 }  // Year-end rally
    ];

    // Store monthly values for average calculation
    const monthlyValues = Array(12).fill(null).map(() => ({
        SP500: { sum: 0, count: 0 },
        DOW: { sum: 0, count: 0 }
    }));

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Check for major events
            const event = events.find(e => e.month === date.getMonth());
            const eventImpact = event ? event.impact / 20 : 0; // Spread impact over ~20 trading days

            // Add randomness and event impact
            const dailyChangeSP500 = dailyGrowthSP500 + (Math.random() - 0.5) * 0.004 + eventImpact;
            const dailyChangeDOW = dailyGrowthDOW + (Math.random() - 0.5) * 0.003 + eventImpact * 0.9;

            // Update values
            sp500Value *= (1 + dailyChangeSP500);
            dowValue *= (1 + dailyChangeDOW);

            // Store rounded values
            const currentMonth = date.getMonth();
            monthlyValues[currentMonth].SP500.sum += sp500Value;
            monthlyValues[currentMonth].SP500.count += 1;
            monthlyValues[currentMonth].DOW.sum += dowValue;
            monthlyValues[currentMonth].DOW.count += 1;

            data.SP500.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(sp500Value * 100) / 100
            });

            data.DOW.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(dowValue * 100) / 100
            });
        }
    }

    // Calculate monthly averages
    const monthlyAverages = monthlyValues.map((month, index) => ({
        month: new Date(2024, index, 1).toLocaleString('default', { month: 'short' }),
        SP500: month.SP500.count > 0 ? month.SP500.sum / month.SP500.count : 0,
        DOW: month.DOW.count > 0 ? month.DOW.sum / month.DOW.count : 0
    }));

    return {
        ...data,
        monthlyAverages
    };
}

export const mockIndexData = generateMockData(); 