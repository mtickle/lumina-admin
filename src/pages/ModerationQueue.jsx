import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Archive, Edit3, X, ChevronLeft, ChevronRight, FileText, Code } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';

export default function ModerationQueue() {
    const [queue, setQueue] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Controls
    const [statusFilter, setStatusFilter] = useState('pending');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const pageSize = 12;

    // Editing State
    const [editingCard, setEditingCard] = useState(null);
    const [editPayload, setEditPayload] = useState('');
    const [deepDiveText, setDeepDiveText] = useState('');
    const [activeTab, setActiveTab] = useState('json'); // 'json' | 'deepdive'

    useEffect(() => {
        fetchQueue();
    }, [statusFilter, typeFilter, page]);

    const fetchQueue = async () => {
        setLoading(true);

        let query = supabase
            .from('feed_cards')
            .select('*', { count: 'exact' })
            .eq('active', true);

        if (statusFilter === 'pending') query = query.eq('is_approved', false);
        if (statusFilter === 'approved') query = query.eq('is_approved', true);
        if (typeFilter !== 'ALL') query = query.eq('card_type', typeFilter);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            setQueue(data);
            setTotalCount(count);
        }
        setLoading(false);
    };

    const approveCard = async (id) => {
        console.log(`Attempting to approve card: ${id}`);
        const { error } = await supabase.from('feed_cards').update({ is_approved: true }).eq('id', id).select();
        if (error) alert(`Approval failed: ${error.message}`);
        else fetchQueue();
    };

    const inactivateCard = async (id) => {
        if (!window.confirm("Inactivate this card? It will be hidden from the feed but remain in the database.")) return;
        const { error } = await supabase.from('feed_cards').update({ active: false, is_approved: false }).eq('id', id).select();
        if (error) alert(`Inactivation failed: ${error.message}`);
        else fetchQueue();
    };

    const openEditModal = async (card) => {
        // Open the modal immediately with base JSON so the UI feels snappy
        setEditingCard(card);
        setEditPayload(JSON.stringify(card.payload, null, 2));

        // Temporarily show loading text in the deep dive tab
        setDeepDiveText('Fetching deep dive content...');
        setActiveTab('json'); // Default to JSON while it fetches

        // If the payload says it has a deep dive, fetch it from the secondary table
        if (card.payload?.hasDeepDive) {
            const { data, error } = await supabase
                .from('deep_dives')
                .select('content_markdown')
                .eq('card_id', card.id)
                .maybeSingle(); // maybeSingle returns null instead of an error if no row exists

            if (data && data.content_markdown) {
                setDeepDiveText(data.content_markdown);
                setActiveTab('deepdive'); // Switch to deep dive tab once loaded
            } else {
                setDeepDiveText('');
            }
        } else {
            setDeepDiveText('');
        }
    };

    const saveEdit = async () => {
        try {
            const updatedPayload = JSON.parse(editPayload);
            const hasContent = deepDiveText.trim().length > 0 && deepDiveText !== 'Fetching deep dive content...';

            // 1. Update the payload boolean indicator
            updatedPayload.hasDeepDive = hasContent;

            // 2. Save the feed_card record
            const { error: cardError } = await supabase
                .from('feed_cards')
                .update({ payload: updatedPayload })
                .eq('id', editingCard.id);

            if (cardError) throw cardError;

            // 3. Handle the deep_dives table relation
            if (hasContent) {
                // Upsert inserts a new row, or updates the existing one if card_id matches
                const { error: ddError } = await supabase
                    .from('deep_dives')
                    .upsert({
                        card_id: editingCard.id,
                        content_markdown: deepDiveText
                    }, { onConflict: 'card_id' });

                if (ddError) throw ddError;
            } else {
                // If they cleared the text entirely, safely delete the relational row
                await supabase
                    .from('deep_dives')
                    .delete()
                    .eq('card_id', editingCard.id);
            }

            setEditingCard(null);
            fetchQueue();
        } catch (e) {
            console.error("Save Error:", e);
            alert("Save failed. Ensure JSON is valid and your database connection is active.");
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const cardTypes = ['ALL', 'PERSON', 'PLACE', 'VERSE', 'INSPIRATIONAL', 'EVENT'];

    return (
        <div className="p-6 md:p-12 min-h-screen bg-zinc-950 text-white relative">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <h1 className="text-3xl font-bold tracking-wide">Content Library</h1>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 shrink-0">
                        {['pending', 'approved', 'all'].map(f => (
                            <button
                                key={f}
                                onClick={() => { setStatusFilter(f); setPage(1); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${statusFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap bg-zinc-900 rounded-lg p-1 border border-zinc-800 gap-1 shrink-0">
                        {cardTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => { setTypeFilter(type); setPage(1); }}
                                className={`px-3 py-2 rounded-md text-xs font-bold tracking-wider transition-colors ${typeFilter === type ? 'bg-sky-900/50 text-sky-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-400">Loading records...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {queue.map((card) => (
                            <ReviewCard
                                key={card.id}
                                card={card}
                                onApprove={() => approveCard(card.id)}
                                onDelete={() => inactivateCard(card.id)}
                                onEdit={() => openEditModal(card)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800">
                            <span className="text-zinc-400 text-sm">
                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Tabbed Edit Modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl flex flex-col h-[90vh]">

                        {/* Header & Tabs */}
                        <div className="flex flex-col border-b border-zinc-800">
                            <div className="flex justify-between items-center p-6 pb-2">
                                <h3 className="font-bold text-xl text-sky-400">Edit Payload: {editingCard.card_type}</h3>
                                <button onClick={() => setEditingCard(null)} className="text-zinc-400 hover:text-white transition-colors">
                                    <X size={28} />
                                </button>
                            </div>
                            <div className="flex gap-6 px-6 pt-2">
                                <button
                                    onClick={() => setActiveTab('json')}
                                    className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'json' ? 'border-sky-500 text-sky-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Code size={16} /> Base Metadata
                                </button>
                                <button
                                    onClick={() => setActiveTab('deepdive')}
                                    className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'deepdive' ? 'border-sky-500 text-sky-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <FileText size={16} /> Deep Dive
                                </button>
                            </div>
                        </div>

                        {/* Editor Panes */}
                        <div className="p-6 flex-grow overflow-hidden flex flex-col">
                            {activeTab === 'json' ? (
                                <>
                                    <label className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">Raw JSON (Excludes Deep Dive)</label>
                                    <textarea
                                        value={editPayload}
                                        onChange={(e) => setEditPayload(e.target.value)}
                                        className="w-full flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-6 font-mono text-base text-sky-300 focus:outline-none focus:border-sky-500 resize-none shadow-inner"
                                    />
                                </>
                            ) : (
                                <>
                                    <label className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">Article Content (Plain Text / Markdown)</label>
                                    <textarea
                                        value={deepDiveText}
                                        onChange={(e) => setDeepDiveText(e.target.value)}
                                        placeholder="Paste article content here. Newlines are safe."
                                        className="w-full flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-6 font-sans text-base text-zinc-300 focus:outline-none focus:border-sky-500 resize-none leading-relaxed shadow-inner whitespace-pre-wrap"
                                    />
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-zinc-900/50 rounded-b-xl">
                            <button
                                onClick={() => setEditingCard(null)}
                                className="px-6 py-3 rounded-lg font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-6 py-3 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
