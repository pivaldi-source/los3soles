import { useEffect, useState } from 'react'
import { getTransactions, getInvestors } from '../lib/api'

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
      const [rows, investors] = await Promise.all([getTransactions(), getInvestors()])
      if (!rows) return
      const totalInvested = (investors ?? []).reduce((acc, i) => acc + Number(i.investment_amount), 0)

      const purchases = rows.filter((r) => r.type === 'purchase')
      const sales = rows.filter((r) => r.type === 'sale')
      const pabloW = rows.filter((r) => r.type === 'withdrawal')
      const cashWithdrawals = rows.filter((r) => r.type === 'cash_withdrawal')

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
      const totalCashWithdrawals = sum(cashWithdrawals)
      const profit = totalSold - totalPurchased
      const cajaDisponible = totalInvested + totalSold - totalPurchased - totalCashWithdrawals

      // Desglose de ventas por día
      const salesByDay = {}
      for (const row of sales) {
        const date = new Date(row.created_at).toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires'
        })
        if (!salesByDay[date]) salesByDay[date] = { albums: 0, stickers: 0, totalAlbums: 0, totalStickers: 0 }
        if (row.product_type === 'album') {
          salesByDay[date].albums += Number(row.quantity)
          salesByDay[date].totalAlbums += Number(row.total_price)
        } else {
          salesByDay[date].stickers += Number(row.quantity)
          salesByDay[date].totalStickers += Number(row.total_price)
        }
      }
      const salesByDayArray = Object.entries(salesByDay)
        .map(([date, v]) => ({ date, ...v, total: v.totalAlbums + v.totalStickers }))
        .sort((a, b) => {
          const parse = (d) => d.split('/').reverse().join('-')
          return parse(a.date).localeCompare(parse(b.date))
        })

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
        cajaDisponible,
        totalInvested,
        totalCashWithdrawals,
        salesByDay: salesByDayArray,
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

      {/* Ventas por día */}
      {data.salesByDay.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Ventas por día</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {data.salesByDay.map((day, i) => (
              <div
                key={day.date}
                className={`px-4 py-3 ${i < data.salesByDay.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-gray-800">📅 {day.date}</span>
                  <span className="text-sm font-bold text-green-700">{formatARS(day.total)}</span>
                </div>
                <div className="flex gap-4">
                  {day.stickers > 0 && (
                    <span className="text-xs text-gray-500">
                      🃏 <span className="font-semibold text-gray-700">{day.stickers}</span> paq · {formatARS(day.totalStickers)}
                    </span>
                  )}
                  {day.albums > 0 && (
                    <span className="text-xs text-gray-500">
                      📔 <span className="font-semibold text-gray-700">{day.albums}</span> álb · {formatARS(day.totalAlbums)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stock disponible */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Stock disponible</h3>
        <div className="space-y-2">
          <StatCard
            color={data.stockAlbums > 0 ? 'gray' : 'red'}
            label="📔 Álbumes disponibles"
            value={`${data.stockAlbums} unidades`}
            sub="Comprados − vendidos − retirados al costo"
          />
          <StatCard
            color={data.stockStickers > 0 ? 'gray' : 'red'}
            label="🃏 Figuritas disponibles"
            value={`${data.stockStickers} paquetes`}
            sub="Comprados − vendidos − retirados al costo"
          />
        </div>
      </section>

      {/* Retiros al costo */}
      {data.totalPabloW > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Retiros al costo</h3>
          <StatCard
            color="orange"
            label="Mercadería retirada al costo (todos los inversores)"
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

      {/* Flujo de caja */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Flujo de caja</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">Capital inicial (inversores)</span>
            <span className="text-sm font-semibold text-gray-700">+{formatARS(data.totalInvested)}</span>
          </div>
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">Ventas realizadas</span>
            <span className="text-sm font-semibold text-green-700">+{formatARS(data.totalSold)}</span>
          </div>
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">Compras realizadas</span>
            <span className="text-sm font-semibold text-red-700">−{formatARS(data.totalPurchased)}</span>
          </div>
          {data.totalCashWithdrawals > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">Retiros en efectivo</span>
              <span className="text-sm font-semibold text-red-700">−{formatARS(data.totalCashWithdrawals)}</span>
            </div>
          )}
          <div className={`px-4 py-4 flex justify-between items-center ${data.cajaDisponible >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div>
              <p className={`text-sm font-bold ${data.cajaDisponible >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                Caja disponible
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Efectivo en mano ahora</p>
            </div>
            <span className={`text-xl font-bold ${data.cajaDisponible >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatARS(data.cajaDisponible)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
