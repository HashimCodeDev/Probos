'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useMemo, useEffect } from 'react';
import Toast from './Toast';

// Constants
const TICKET_STATUS = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved'
} as const;

type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // ms

// Extracted SVG Icons
const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const SpinnerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={`${className} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

interface ResolveButtonProps {
    ticketId: string;
    status: TicketStatus;
    onResolve: (ticketId: string) => Promise<void>;
}

export default function ResolveButton({ ticketId, status, onResolve }: ResolveButtonProps) {
    const [isResolving, setIsResolving] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });
    const [optimisticStatus, setOptimisticStatus] = useState<TicketStatus>(status);

    // Update optimistic status when prop changes
    useEffect(() => {
        setOptimisticStatus(status);
    }, [status]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type, isVisible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleResolveWithRetry = useCallback(async (attempt = 0): Promise<void> => {
        try {
            await onResolve(ticketId);
            setOptimisticStatus(TICKET_STATUS.RESOLVED);
            showToast('Ticket resolved successfully!', 'success');
        } catch (error) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                await sleep(RETRY_DELAY);
                return handleResolveWithRetry(attempt + 1);
            }
            
            // Revert optimistic update
            setOptimisticStatus(status);
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to resolve ticket';
            console.error('Failed to resolve ticket:', error);
            showToast(`Error: ${errorMessage}. Please try again.`, 'error');
            throw error;
        }
    }, [ticketId, onResolve, status, showToast]);

    const handleResolve = useCallback(async () => {
        setIsResolving(true);
        setShowConfirmation(false);
        
        // Optimistic update
        setOptimisticStatus(TICKET_STATUS.RESOLVED);
        
        try {
            await handleResolveWithRetry();
        } catch (error) {
            // Error already handled in retry logic
        } finally {
            setIsResolving(false);
        }
    }, [handleResolveWithRetry]);

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            setShowConfirmation(true);
        }
        if (event.key === 'Escape') {
            setShowConfirmation(false);
        }
    }, []);

    // Memoized class names
    const buttonClassName = useMemo(() => {
        const baseClasses = [
            'inline-flex items-center px-4 py-2',
            'bg-linear-to-r from-emerald-500 to-green-600',
            'hover:from-emerald-600 hover:to-green-700',
            'text-white rounded-xl',
            'text-xs sm:text-sm font-bold uppercase tracking-wide',
            'shadow-lg shadow-emerald-500/30',
            'hover:shadow-emerald-500/50',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
        ];
        
        if (isResolving) {
            baseClasses.push('animate-pulse');
        }
        
        return baseClasses.join(' ');
    }, [isResolving]);

    const resolvedBadgeClassName = useMemo(() => [
        'inline-flex items-center px-3 py-1.5',
        'bg-slate-500/10 border border-slate-500/20',
        'text-slate-500 rounded-lg',
        'text-xs sm:text-sm font-semibold cursor-not-allowed'
    ].join(' '), []);

    // If already resolved, show a muted badge
    if (optimisticStatus === TICKET_STATUS.RESOLVED) {
        return (
            <>
                <span 
                    className={resolvedBadgeClassName}
                    aria-disabled="true"
                    aria-label="Ticket already resolved"
                >
                    <CheckIcon className="w-3.5 h-3.5 mr-1.5" />
                    Resolved
                </span>
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={hideToast}
                />
            </>
        );
    }

    return (
        <>
            <div onKeyDown={handleKeyPress} className="inline-block">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowConfirmation(true)}
                    disabled={isResolving}
                    className={buttonClassName}
                    aria-label={isResolving ? 'Resolving ticket' : 'Resolve ticket'}
                    aria-busy={isResolving}
                    aria-live="polite"
                    title="Resolve this ticket (Ctrl+R)"
                >
                    {isResolving ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 mr-1.5" />
                            <span>Resolving...</span>
                        </>
                    ) : (
                        <>
                            <CheckIcon className="w-4 h-4 mr-1.5" />
                            <span>Resolve</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowConfirmation(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
                            role="dialog"
                            aria-labelledby="confirmation-title"
                            aria-describedby="confirmation-description"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="shrink-0 w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 id="confirmation-title" className="text-lg font-bold text-white mb-2">
                                        Resolve Ticket?
                                    </h3>
                                    <p id="confirmation-description" className="text-sm text-slate-300 mb-6">
                                        Are you sure you want to mark ticket <span className="font-mono text-emerald-400">#{ticketId}</span> as resolved? This action will update the ticket status.
                                    </p>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleResolve}
                                            disabled={isResolving}
                                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setShowConfirmation(false)}
                                            disabled={isResolving}
                                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </>
    );
}
