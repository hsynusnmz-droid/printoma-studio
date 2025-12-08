import React, { ReactNode } from 'react';

interface StudioLayoutProps {
    leftPanel: ReactNode;
    centerPanel: ReactNode;
    rightPanel: ReactNode;
    modals?: ReactNode;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({ leftPanel, centerPanel, rightPanel, modals }) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
            {/* LEFT SIDEBAR */}
            <aside className="w-[320px] flex-shrink-0 h-full z-20 border-r border-gray-200 bg-white relative overflow-y-auto hidden md:block">
                {leftPanel}
            </aside>

            {/* CENTER CANVAS AREA */}
            <main className="flex-1 relative flex flex-col h-full min-w-0 z-10 bg-gray-50">
                {centerPanel}
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="w-[360px] flex-shrink-0 h-full z-20 border-l border-gray-200 bg-white relative overflow-y-auto hidden lg:block">
                {rightPanel}
            </aside>

            {/* MODALS OVERLAY (Pointer events passed through if empty) */}
            {modals && (
                <div className="absolute inset-0 pointer-events-none z-50">
                    {modals}
                </div>
            )}
        </div>
    );
};
