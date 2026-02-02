
import React, { useState } from 'react';

interface Notification {
    id: number;
    type: 'Critical' | 'Warning' | 'Info' | 'Success';
    category: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        type: 'Critical',
        category: 'Macro Event',
        title: 'Critical Objective Lost',
        description: 'Opponent secured Baron Nashor due to vision lapse in top-side river. Recommended immediate defensive formation at inhibitor turrets. AI analysis indicates 85% probability of bottom lane push.',
        time: '12 mins ago',
        read: false
    },
    {
        id: 2,
        type: 'Warning',
        category: 'Micro-Mistake Detected',
        title: 'Inefficient Jungle Pathing',
        description: 'Player: Blaber. Inefficient jungle pathing detected during second clear. Delayed arrival to mid-lane counter-gank by 4 seconds. Potential gold loss estimated at 350g.',
        time: '45 mins ago',
        read: true
    },
    {
        id: 3,
        type: 'Info',
        category: 'Strategy Optimization',
        title: 'New Itemization Route',
        description: 'New itemization route available for Lucian against heavy tank compositions. Win rate projection increases by 4.2% with Lord Dominik\'s Regards as third item.',
        time: '2 hours ago',
        read: true
    },
    {
        id: 4,
        type: 'Success',
        category: 'Tempo Advantage Gained',
        title: 'Macro Execution Success',
        description: 'Team successfully utilized Herald push mid to open map. Vision control extended into enemy jungle quadrants.',
        time: 'Yesterday, 14:20 PM',
        read: true
    }
];

const NotificationsView: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');

    // Derived state for filtering
    const filteredNotifications = MOCK_NOTIFICATIONS.filter(notif => {
        const matchesSearch = notif.title.toLowerCase().includes(search.toLowerCase()) ||
            notif.description.toLowerCase().includes(search.toLowerCase());
        const matchesSeverity = filterSeverity === 'All' || notif.type === filterSeverity;
        const matchesType = filterType === 'All' || notif.category.includes(filterType); // Loose matching for category

        return matchesSearch && matchesSeverity && matchesType;
    });

    const getSeverityColor = (type: string) => {
        switch (type) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Success': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-400';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Critical': return 'priority_high';
            case 'Warning': return 'warning';
            case 'Success': return 'bolt';
            case 'Info': return 'tips_and_updates';
            default: return 'notifications';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0E100A] text-white">
            {/* Header */}
            <header className="flex justify-between items-center p-6 border-b border-white/5 sticky top-0 bg-[#0E100A]/95 backdrop-blur z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-sm text-gray-500">Archive of all AI alerts, tactical shifts, and system notifications.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium transition">
                        <span className="material-icons-outlined text-sm">file_download</span>
                        Export CSV
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="p-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <span className="material-icons-outlined absolute left-3 top-2.5 text-gray-500 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="Search by keyword..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface-dark border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600 outline-none"
                    />
                </div>

                {/* Alert Type Dropdown */}
                <div className="relative group">
                    <div className="flex items-center justify-between w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-outlined text-sm">category</span>
                            <span>Alert Type: {filterType}</span>
                        </div>
                        <span className="material-icons-outlined text-sm">expand_more</span>
                    </div>
                </div>

                {/* Severity Dropdown */}
                <div className="relative">
                    <select
                        className="w-full appearance-none bg-surface-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 cursor-pointer outline-none focus:border-primary"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                    >
                        <option value="All">Severity: All</option>
                        <option value="Critical">Critical</option>
                        <option value="Warning">Warning</option>
                        <option value="Info">Info</option>
                        <option value="Success">Success</option>
                    </select>
                    <span className="material-icons-outlined absolute right-3 top-2.5 text-gray-500 text-sm pointer-events-none">expand_more</span>
                </div>

                {/* Date Dropdown (Static for demo) */}
                <div className="relative">
                    <div className="flex items-center justify-between w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-outlined text-sm">calendar_today</span>
                            <span>Date: Last 30 Days</span>
                        </div>
                        <span className="material-icons-outlined text-sm">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">
                    <span>Recent Alerts ({filteredNotifications.length})</span>
                    <button onClick={() => { setSearch(''); setFilterSeverity('All'); }} className="hover:text-white transition">Clear Filters</button>
                </div>

                {filteredNotifications.map(notification => (
                    <div key={notification.id} className="group bg-surface-dark hover:bg-surface-darker/80 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all cursor-pointer flex gap-4">
                        {/* Status Icon */}
                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getSeverityColor(notification.type)}`}>
                            <span className="material-icons-outlined">{getIcon(notification.type)}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-white font-bold text-base group-hover:text-primary transition-colors">
                                    {notification.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityColor(notification.type).replace('bg-opacity-10', 'bg-opacity-5')}`}>
                                        {notification.category}
                                    </span>
                                    <span className="text-xs text-gray-500">{notification.time}</span>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                {notification.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 group-hover:text-white transition-colors">
                                View Context
                                <span className="material-icons-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredNotifications.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <span className="material-icons-outlined text-4xl mb-4 opacity-50">notifications_off</span>
                        <p>No notifications found matching your filters.</p>
                    </div>
                )}

                <div className="flex justify-center pt-8 pb-4">
                    <button className="text-sm text-gray-500 hover:text-white transition border-b border-dashed border-gray-700 hover:border-white pb-1">
                        Load Older Notifications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsView;
