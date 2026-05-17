import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const formatARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function StatCard({ label, value, sub, color = 'gray' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  }
  return (
    <div className={`border rounded-xl px-4 py-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Estadisticas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase.from('transactions').select('*')
      if (!rows) return

      const purchases = rows.filter((r) => r.type === 'purchase')
      const sales = rows.filter((r) => r.type === 'sale')
      const pabloW = rows.filter((r) => r.type === 'pablo_withdrawal')

      const sum = (arr) => arr.reduce((acc, r) => acc + Number(r.total_price), 0)
      const sumQty = (arr) => arr.reduce((acc, r) => acc + Number(r.quantity), 0)

      const purchaseAlbums = purchases.filter((r) => r.product_type === 'album')
      const purchaseStickers = purchases.filter((r) => r.product_type === 'stickers')
      const saleAlbums = sales.filter((r) => r.product_type === 'album')
      const saleStickers = sales.filter((r) => r.product_type === 'stickers')
      const pabloAlbums = pabloW.filter((r) => r.product_type === 'album')
      const pabloStickers = pabloW.filter((r) => r.product_type === 'stickers')

      const totalPurchased = sum(purchases)
      const totalSold = sum(sales)
      const totalPabloW = sum(pabloW)
      const profit = totalSold - totalPurchased

      setData({
        purchaseAlbums: { qty: sumQty(purchaseAlbums), total: sum(purchaseAlbums) },
        purchaseStickers: { qty: sumQty(purchaseStickers), total: sum(purchaseStickers) },
        saleAlbums: { qty: sumQty(saleAlbums), total: sum(saleAlbums) },
        saleStickers: { qty: sumQty(saleStickers), total: sum(saleStickers) },
        stockAlbums: sumQty(purchaseAlbums) - sumQty(saleAlbums) - sumQty(pabloAlbums),
        stockStickers: sumQty(purchaseStickers) - sumQty(saleStickers) - sumQty(pabloStickers),
        totalPurchased,
        totalSold,
        totalPabloW,
        pabloQty: sumQty(pabloW),
        profit,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-center text-gray-400 mt-10">Cargando...</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas</h2>
        <p className="text-gray-500 text-sm mt-1">Resumen general del negocio</p>
      </div>

      {/* Compras */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Compras</h3>
        <div className="space-y-2">
          <StatCard
            color="blue"
            label="📔 Álbumes comprados"
            value={formatARS(data.purchaseAlbums.total)}
            sub={`${data.purchaseAlbums.qty} unidades`}
          />
          <StatCard
            color="blue"
            label="🃏 Figuritas compradas"
            value={formatARS(data.purchaseStickers.total)}
            sub={`${data.purchaseStickers.qty} paquetes`}
          />
          <StatCard
            color="blue"
            label="Total compras"
            value={formatARS(data.totalPurchased)}
            sub="Inversión total en mercadería"
          />
        </div>
      </section>

      {/* Ventas */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Ventas</h3>
        <div className="space-y-2">
          <StatCard
            color="green"
            label="📔 Álbumes vendidos"
            value={formatARS(data.saleAlbums.total)}
            sub={`${data.saleAlbums.qty} unidades`}
          />
          <StatCard
            color="green"
            label="🃏 Figuritas vendidas"
            value={formatARS(data.saleStickers.total)}
            sub={`${data.saleStickers.qty} paquetes`}
          />
          <StatCard
            color="green"
            label="Total ventas"
            value={formatARS(data.totalSold)}
            sub="Ingresos totales por ventas"
          />
        </div>
      </section>

      {/* Stock disponible */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Stock disponible</h3>
        <div className="space-y-2">
          <StatCard
            color={data.stockAlbums > 0 ? 'gray' : 'red'}
            label="📔 Álbumes disponibles"
            value={`${data.stockAlbums} unidades`}
            sub="Comprados − vendidos − retirados por Pablo"
          />
          <StatCard
            color={data.stockStickers > 0 ? 'gray' : 'red'}
            label="🃏 Figuritas disponibles"
            value={`${data.stockStickers} paquetes`}
            sub="Comprados − vendidos − retirados por Pablo"
          />
        </div>
      </section>

      {/* Retiros Pablo */}
      {data.totalPabloW > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Retiros Pablo al costo</h3>
          <StatCard
            color="orange"
            label="Mercadería retirada al costo"
            value={formatARS(data.totalPabloW)}
            sub={`${data.pabloQty} unidades`}
          />
        </section>
      )}

      {/* Resumen financiero */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Resultado</h3>
        <div className="space-y-2">
          <StatCard
            color="purple"
            label="Inversión total"
            value={formatARS(data.totalPurchased)}
          />
          <StatCard
            color={data.profit >= 0 ? 'green' : 'red'}
            label="Ganancia total"
            value={formatARS(data.profit)}
            sub="Ventas − Compras"
          />
          <div className={`border rounded-xl px-4 py-3 ${data.profit >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
            <p className="text-xs font-medium opacity-70">Diferencia (saldo actual)</p>
            <p className={`text-2xl font-bold mt-1 ${data.profit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {data.profit >= 0 ? '+' : ''}{formatARS(data.profit)}
            </p>
            <p className="text-xs opacity-60 mt-0.5">
              {data.profit >= 0 ? 'El negocio está en ganancia' : 'Aún en zona de inversión'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
