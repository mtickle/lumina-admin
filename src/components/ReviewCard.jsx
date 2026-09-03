function ReviewCard({ card, onApprove, onDelete }) {
    const payload = card.payload || {};

    // Quick normalization for the preview
    const title = card.card_type === 'PERSON' ? card.metadata_anchor.split(':')[0] : (payload.locationName || card.metadata_anchor);
    const description = payload.description || payload.hookText || payload.verseText || payload.quote || 'No description';
    const imageUrl = payload.imageUrl || payload.mapImageUrl || payload.bgUrl;

    // Simulate your fallback logic
    const previewImage = (imageUrl && !imageUrl.includes('source.unsplash.com'))
        ? imageUrl
        : `https://picsum.photos/seed/${encodeURIComponent(payload.imageKeyword || 'lumina')}/400/600`;

    return (
        <div className="flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
            {/* Image Preview Container */}
            <div className="relative h-48 w-full bg-zinc-800">
                <img
                    src={previewImage}
                    alt="Card background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white tracking-wider">
                    {card.card_type}
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-4 flex-grow">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-zinc-800">
                    <button
                        onClick={onDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={18} /> Discard
                    </button>
                    <button
                        onClick={onApprove}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                    >
                        <Check size={18} /> Approve
                    </button>
                </div>
            </div>
        </div>
    );
}