import { Check, Archive, Edit3, FileText } from 'lucide-react';

export default function ReviewCard({ card, onApprove, onDelete, onEdit }) {
    const payload = card.payload || {};
    const title = card.card_type === 'PERSON' ? card.metadata_anchor.split(':')[0] : (payload.locationName || card.metadata_anchor);
    const description = payload.description || payload.hookText || payload.verseText || payload.quote || 'No description';
    const imageUrl = payload.imageUrl || payload.mapImageUrl || payload.bgUrl;

    const previewImage = (imageUrl && !imageUrl.includes('source.unsplash.com'))
        ? imageUrl
        : `https://picsum.photos/seed/${encodeURIComponent(payload.imageKeyword || 'lumina')}/400/600`;

    // Determine if the card actually has deep dive content
    const hasDeepDiveContent = !!(payload.hasDeepDive || payload.has_deep_dive);

    return (
        <div className="flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
            <div className="relative h-48 w-full bg-zinc-800 group">
                <img
                    src={previewImage}
                    alt="Card preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider w-fit">
                        {card.card_type}
                    </span>
                    {card.is_approved && (
                        <span className="bg-emerald-500/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider w-fit">
                            APPROVED
                        </span>
                    )}
                    {hasDeepDiveContent && (
                        <span className="bg-sky-600/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider w-fit flex items-center gap-1">
                            DEEP DIVE
                        </span>
                    )}
                </div>
                <button
                    onClick={onEdit}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-sky-600 backdrop-blur rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Edit Data"
                >
                    <Edit3 size={18} />
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