'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Ticket {
    id: string;
    issue: string;
    severity: string;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
    sensor: {
        sensorId: string;
        zone: string;
        type: string;
    };
}

export default function Maintenance() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, [filter]);

    const fetchTickets = async () => {
        try {
            const url = filter
                ? `${API_URL}/api/tickets?status=${filter}`
                : `${API_URL}/api/tickets`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setTickets(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'High': return 'text-red-700 bg-red-100';
            case 'Medium': return 'text-yellow-700 bg-yellow-100';
            case 'Low': return 'text-blue-700 bg-blue-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'text-red-700 bg-red-100';
            case 'InProgress': return 'text-yellow-700 bg-yellow-100';
            case 'Resolved': return 'text-green-700 bg-green-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-gray-600">Loading tickets...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Maintenance Tickets</h1>

            {/* Filter Buttons */}
            <div className="mb-6 flex space-x-3">
                <button
                    onClick={() => setFilter(null)}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === null
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    All Tickets
                </button>
                <button
                    onClick={() => setFilter('Open')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'Open'
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Open
                </button>
                <button
                    onClick={() => setFilter('InProgress')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'InProgress'
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    In Progress
                </button>
                <button
                    onClick={() => setFilter('Resolved')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'Resolved'
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Resolved
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{tickets.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                        {tickets.filter(t => t.status === 'Open').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Resolved Tickets</h3>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                        {tickets.filter(t => t.status === 'Resolved').length}
                    </p>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sensor ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Issue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No tickets found
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {ticket.sensor.sensorId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket.sensor.zone}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                            {ticket.issue}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(ticket.severity)}`}>
                                                {ticket.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(ticket.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
