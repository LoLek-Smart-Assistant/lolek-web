import { useEffect, useState } from 'react'
import itemService from '../services/itemService'
import type { Item } from '../services/syncService'

export function ItemsGallery() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const loadedItems = await itemService.fetchItems()
        setItems(loadedItems)
        setError(null)
      } catch (err) {
        console.error('Failed to load items:', err)
        setError('Failed to load items')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-400">Loading items...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
        <div className="text-center text-rose-400">{error}</div>
      </div>
    )
  }

  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_20px_70px_rgba(8,15,35,0.35)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            Items Library
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            League of Legends Items
          </h3>
        </div>
        <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {items.length} items
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {items.map((item) => (
          <div
            key={item._id}
            className="group relative flex flex-col items-center gap-2 rounded-lg p-2 hover:bg-white/[0.08] transition-colors"
            title={item.itemName}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.itemName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-md object-cover bg-slate-900"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                {item.itemId}
              </div>
            )}
            <div className="text-xs text-center text-slate-300 truncate w-full group-hover:text-white">
              {item.itemName}
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[0.6rem] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
