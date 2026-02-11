
import React, { useState, useEffect } from 'react';

interface MapSource {
    name: string;
    url: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    categories: { [key: string]: MapSource[] };
}

export const MapSelector: React.FC<Props> = ({ isOpen, onClose, onSelect, categories }) => {
    const [activeCategory, setActiveCategory] = useState<string>('');

    useEffect(() => {
        if (isOpen && !activeCategory) {
            const firstCategory = Object.keys(categories)[0];
            if (firstCategory) setActiveCategory(firstCategory);
        }
    }, [isOpen, categories, activeCategory]);

    if (!isOpen) return null;

    const currentMaps = activeCategory ? categories[activeCategory] : [];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white">選擇內建地圖</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-2 mb-4 border-b border-white/10">
                    {Object.keys(categories).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1 font-bold text-sm whitespace-nowrap shrink-0 transition-all border-b-2 ${activeCategory === cat ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'} `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentMaps.map((map) => (
                            <button
                                key={map.url}
                                onClick={() => { onSelect(map.url); onClose(); }}
                                className="group relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500 transition-all text-left"
                            >
                                <img
                                    src={map.url}
                                    alt={map.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                                    <span className="text-xs font-bold text-white drop-shadow-md">{map.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

