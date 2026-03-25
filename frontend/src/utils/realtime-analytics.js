// Utilities to transform PostgreSQL Claims array into Real-Time Analytics charts
export function processRealTimeClaims(claims, preset) {
    const now = new Date();
    
    // Helper to get start of day
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    let buckets = [];
    
    if (preset === '1W') {
        const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        for(let i=6; i>=0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            buckets.push({ date: startOfDay(d), label: DAYS[d.getDay()], claims: 0, fraud: 0, approved: 0, revenue: 0 });
        }
    } else if (preset === '1M') {
        for(let i=29; i>=0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            buckets.push({ date: startOfDay(d), label: `${d.getDate()}`, claims: 0, fraud: 0, approved: 0, revenue: 0 });
        }
    } else if (preset === '3M') {
        for(let i=11; i>=0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - (i*7));
            buckets.push({ date: startOfDay(d), label: `W${12-i}`, claims: 0, fraud: 0, approved: 0, revenue: 0, isWeek: true });
        }
    } else if (preset === '1Y') {
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for(let i=11; i>=0; i--) {
            const d = new Date(now); d.setMonth(d.getMonth() - i);
            buckets.push({ month: d.getMonth(), year: d.getFullYear(), label: MONTHS[d.getMonth()], claims: 0, fraud: 0, approved: 0, revenue: 0 });
        }
    } else if (preset.includes('-')) {
        // Custom Month
        const [year, month] = preset.split('-').map(Number);
        const days = new Date(year, month, 0).getDate();
        for(let i=1; i<=days; i++) {
            buckets.push({ date: new Date(year, month-1, i), label: `${i}`, claims: 0, fraud: 0, approved: 0, revenue: 0 });
        }
    } else {
        // Default 6M
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for(let i=5; i>=0; i--) {
            const d = new Date(now); d.setMonth(d.getMonth() - i);
            buckets.push({ month: d.getMonth(), year: d.getFullYear(), label: MONTHS[d.getMonth()], claims: 0, fraud: 0, approved: 0, revenue: 0 });
        }
    }

    // Now populate from actual claims
    claims.forEach(c => {
        if (!c.date) return;
        const cDate = new Date(c.date);
        
        let targetBucket = null;
        
        if (preset === '6M' || preset === '1Y') {
            targetBucket = buckets.find(b => b.month === cDate.getMonth() && b.year === cDate.getFullYear());
        } else if (preset === '3M') {
            // Find closest week bucket
            targetBucket = [...buckets].reverse().find(b => startOfDay(cDate) >= b.date);
        } else {
            // Exact day
            targetBucket = buckets.find(b => b.date && b.date.getTime() === startOfDay(cDate).getTime());
        }

        if (targetBucket) {
            targetBucket.claims += 1;
            if (c.status === 'Flagged' || c.status === 'Rejected') targetBucket.fraud += 1;
            if (c.status === 'Approved') targetBucket.approved += 1;
            targetBucket.revenue += (c.amount || 0) / 10000; // Scaled to abstract units
        }
    });

    return buckets.map(b => ({
       label: b.label,
       claims: b.claims,
       fraud: b.fraud,
       approved: b.approved,
       revenue: Number(b.revenue.toFixed(1))
    }));
}

export function processRealTimeKPIs(claims) {
    if (!claims || claims.length === 0) return null;
    const total = claims.length;
    const approved = claims.filter(c => c.status === 'Approved').length;
    const pending = claims.filter(c => c.status === 'Pending').length;
    const flagged = claims.filter(c => c.status === 'Flagged' || c.status === 'Rejected').length;
    
    // Generate real Categories Pie chart data based on "claim_type"
    const types = {};
    claims.forEach(c => {
        if (!c.claim_type) return;
        const type = c.claim_type.split(' ')[0]; // e.g. "Auto", "Medical"
        types[type] = (types[type] || 0) + 1;
    });
    
    const colors = ['#f5550f', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];
    const fraud_categories = Object.entries(types).map(([name, value], i) => ({
        name: name + ' Fraud',
        value,
        color: colors[i % colors.length]
    }));

    return {
        total_claims: total,
        approved_claims: approved,
        pending_claims: pending,
        flagged_claims: flagged,
        total_revenue: claims.reduce((s,c) => s + (c.amount || 0), 0),
        active_policies: Math.floor(total * 1.5), // rough estimate
        fraud_categories: fraud_categories.length > 0 ? fraud_categories : null
    };
}
