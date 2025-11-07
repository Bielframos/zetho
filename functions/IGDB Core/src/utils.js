export function normalizeGame(game) {
    return {
        name: game.name,
        slug: game.slug,
        coverUrl: game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null,
        summary: game.summary || '',
        releaseYear: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : null,
        externalReference: game.id,
        gameType: `igdb_${game.game_type}`,
    }
}