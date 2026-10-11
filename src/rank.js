// results: [{ userId, score, cpm, accuracy }, ...]
export function rankResults(results) {
  return [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score // pehle words
    if (b.cpm !== a.cpm) return b.cpm - a.cpm                              // tie par CPM
    return b.accuracy - a.accuracy
  })
}