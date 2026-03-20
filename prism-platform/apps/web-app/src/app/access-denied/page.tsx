'use client';

import React from 'react';

export default function AccessDeniedPage() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-950 via-[#09090B] to-[#09090B]">
            {/* Animated pulse border */}
            <div className="absolute inset-0 border-2 border-red-600/20 animate-pulse" />

            <div className="text-center space-y-6 p-8">
                {/* Animated warning icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping" />
                    <div className="relative w-full h-full flex items-center justify-center rounded-full bg-red-600/20 border-2 border-red-500/40">
                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-red-500 tracking-widest mb-3">
                        ACCESS DENIED
                    </h1>
                    <p className="text-obsidian-400 text-sm md:text-base max-w-md mx-auto">
                        No employee ID was found in the URL. Access to Prism requires a valid <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-xs">?EMPID=</code> parameter.
                    </p>
                </div>

                {/* Info box */}
                <div className="max-w-sm mx-auto rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300/70">
                    If you believe this is an error, please contact your administrator or try accessing the application through the provided link.
                </div>
            </div>
        </div>
    );
}
