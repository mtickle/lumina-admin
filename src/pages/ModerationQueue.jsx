import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Archive, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ModerationQueue() {
    const [queue, setQueue] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Controls
    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'approved', 'all'
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'PERSON', 'PLACE', 'VERSE', 'INSPIRATIONAL'
    const [page, setPage] = useState(1);
    const pageSize = 12;

    // Editing State
    const [editingCard, setEditingCard] = useState(null);
    const [editPayload, setEditPayload] = useState('');

    useEffect(() => {
        fetchQueue();
    }, [statusFilter, typeFilter, page]);

    const fetchQueue = async () => {
        setLoading(true);

        // Base query: only pull active cards to hide soft-deleted records
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

        const { data, error } = await supabase
            .from('feed_cards')
            .update({ is_approved: true })
            .eq('id', id)
            .select();

        if (error) {
            console.error("Supabase Update Error:", error);
            alert(`Approval failed: ${error.message}`);
            return;
        }

        console.log("Successfully approved:", data);
        fetchQueue();
    };

    const inactivateCard = async (id) => {
        if (!window.confirm("Inactivate this card? It will be hidden from the feed but remain in the database.")) return;

        console.log(`Attempting to inactivate card: ${id}`);

        const { data, error } = await supabase
            .from('feed_cards')
            .update({ active: false, is_approved: false })
            .eq('id', id)
            .select();

        if (error) {
            console.error("Supabase Update Error:", error);
            alert(`Inactivation failed: ${error.message}`);
            return;
        }

        console.log("Successfully inactivated:", data);
        fetchQueue();
    };

    const saveEdit = async () => {
        try {
            const updatedPayload = JSON.parse(editPayload);
            console.log(`Attempting to save edits for card: ${editingCard.id}`);

            const { data, error } = await supabase
                .from('feed_cards')
                .update({ payload: updatedPayload })
                .eq('id', editingCard.id)
                .select();

            if (error) {
                console.error("Supabase Update Error:", error);
                alert(`Database Error: ${error.message}`);
                return;
            }

            console.log("Successfully saved edits:", data);
            setEditingCard(null);
            fetchQueue();
        } catch (e) {
            console.error("JSON Parsing Error:", e);
            alert("Save failed. Ensure the JSON format is valid.");
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const cardTypes = ['ALL', 'PERSON', 'PLACE', 'VERSE', 'INSPIRATIONAL'];

    return (
        <div className="p-6 md:p-12 min-h-screen bg-zinc-950 text-white relative">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <h1 className="text-3xl font-bold tracking-wide">Content Library</h1>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* Status Filters */}
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

                    {/* Type Filters */}
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
                                onEdit={() => {
                                    setEditingCard(card);
                                    setEditPayload(JSON.stringify(card.payload, null, 2));
                                }}
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

            {/* Massively Expanded Edit Modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl flex flex-col h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h3 className="font-bold text-xl text-sky-400">Edit Payload: {editingCard.card_type}</h3>
                            <button onClick={() => setEditingCard(null)} className="text-zinc-400 hover:text-white transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <div className="p-6 flex-grow overflow-hidden flex flex-col">
                            <label className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">Raw JSON Data</label>
                            <textarea
                                value={editPayload}
                                onChange={(e) => setEditPayload(e.target.value)}
                                className="w-full flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-6 font-mono text-base text-sky-300 focus:outline-none focus:border-sky-500 resize-none leading-relaxed shadow-inner"
                            />
                        </div>
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

function ReviewCard({ card, onApprove, onDelete, onEdit }) {
    const payload = card.payload || {};
    const title = card.card_type === 'PERSON' ? card.metadata_anchor.split(':')[0] : (payload.locationName || card.metadata_anchor);
    const description = payload.description || payload.hookText || payload.verseText || payload.quote || 'No description';
    const imageUrl = payload.imageUrl || payload.mapImageUrl || payload.bgUrl;

    const previewImage = (imageUrl && !imageUrl.includes('source.unsplash.com'))
        ? imageUrl
        : `https://picsum.photos/seed/${encodeURIComponent(payload.imageKeyword || 'lumina')}/400/600`;

    return (
        <div className="flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
            <div className="relative h-48 w-full bg-zinc-800 group">
                <img
                    src={previewImage}
                    alt="Card preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                    <span className="bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider">
                        {card.card_type}
                    </span>
                    {card.is_approved && (
                        <span className="bg-emerald-500/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider">
                            APPROVED
                        </span>
                    )}
                </div>
                <button
                    onClick={onEdit}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-sky-600 backdrop-blur rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit JSON"
                >
                    <Edit3 size={16} />
                </button>
            </div>

            <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-4 flex-grow">
                    {description}
                </p>

                <div className="flex gap-2 mt-auto pt-4 border-t border-zinc-800">
                    <button
                        onClick={onDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
                        title="Inactivate"
                    >
                        <Archive size={18} />
                    </button>
                    {!card.is_approved && (
                        <button
                            onClick={onApprove}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                        >
                            <Check size={18} /> Approve
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}