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

    // Key events to simulate (dates and impacts)
    const events = [
        { month: 2, impact: -0.05 }, // Market correction
        { month: 5, impact: 0.07 },  // Strong earnings season
        { month: 8, impact: -0.03 }, // Economic concerns
        { month: 11, impact: 0.06 }  // Year-end rally
    ];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Check for major events
            const event = events.find(e => e.month === date.getMonth());
            const eventImpact = event ? event.impact / 20 : 0; // Spread impact over ~20 trading days

            // Base daily changes
            const baseChangeSP500 = 0.00033; // ~12% annual growth
            const baseChangeDOW = 0.00027;   // ~10% annual growth

            // Add randomness and event impact
            const dailyChangeSP500 = baseChangeSP500 + (Math.random() - 0.5) * 0.005 + eventImpact;
            const dailyChangeDOW = baseChangeDOW + (Math.random() - 0.5) * 0.004 + eventImpact * 0.9;

            // Update values
            sp500Value *= (1 + dailyChangeSP500);
            dowValue *= (1 + dailyChangeDOW);

            // Store rounded values
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

    return data;
}

export const mockIndexData = generateMockData(); 