import { useEffect, useState } from 'react'
import { getTransactions, getInvestors, createTransaction } from '../lib/api'

const formatARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const pct = (n) => `${(n * 100).toFixed(1)}%`

export default function Inversores() {
  const [investors, setInvestors] = useState([])
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(true)

  // Pablo withdrawal form
  const [showForm, setShowForm] = useState(false)
  const [productType, setProductType] = useState('stickers')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const withdrawalTotal = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0

  async function load() {
    const [invRows, txRows] = await Promise.all([
      getInvestors(),
      getTransactions(),
    ])

    if (!invRows || !txRows) return

    const purchases = txRows.filter((r) => r.type === 'purchase')
    const sales = txRows.filter((r) => r.type === 'sale')
    const pabloW = txRows.filter((r) => r.type === 'pablo_withdrawal')

    const sum = (arr) => arr.reduce((acc, r) => acc + Number(r.total_price), 0)
    const sumQty = (arr) => arr.reduce((acc, r) => acc + Number(r.quantity), 0)

    const totalPurchased = sum(purchases)
    const totalSold = sum(sales)
    const totalPabloW = sum(pabloW)
    const totalInvested = invRows.reduce((acc, i) => acc + Number(i.investment_amount), 0)

    const grossProfit = totalSold - totalPurchased
    const investorPool = grossProfit > 0 ? grossProfit * 0.5 : 0
    const businessPool = grossProfit > 0 ? grossProfit * 0.5 : 0

    setInvestors(invRows)
    setFinancials({
      totalPurchased,
      totalSold,
      totalPabloW,
      pabloQty: sumQty(pabloW),
      grossProfit,
      investorPool,
      businessPool,
      totalInvested,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleWithdrawal(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTransaction({
        type: 'pablo_withdrawal',
        product_type: productType,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        total_price: withdrawalTotal,
      })
      setFormSuccess(true)
      setQuantity('')
      setUnitPrice('')
      setShowForm(false)
      await load()
    } catch {
      // error silencioso por ahora
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 mt-10">Cargando...</p>
  if (!financials) return null

  const { grossProfit, investorPool, businessPool, totalInvested, totalPabloW, pabloQty } = financials

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inversores</h2>
        <p className="text-gray-500 text-sm mt-1">Distribución de ganancias y retornos</p>
      </div>

      {/* Resumen general */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-bold text-gray-700">Resultado del negocio</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
            <p className="text-xs text-purple-600">Ganancia bruta</p>
            <p className={`font-bold text-lg ${grossProfit >= 0 ? 'text-purple-800' : 'text-red-700'}`}>
              {formatARS(grossProfit)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-600">Para el negocio (50%)</p>
            <p className="font-bold text-lg text-gray-800">{formatARS(businessPool)}</p>
          </div>
        </div>
        {grossProfit <= 0 && (
          <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            ⏳ Aún sin ganancia para distribuir. Las ganancias se calculan cuando las ventas superen las compras.
          </p>
        )}
      </div>

      {/* Tarjetas por inversor */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Detalle por inversor</h3>
        {investors.map((inv) => {
          const share = Number(inv.investment_amount) / totalInvested
          const cashReturn = investorPool * share
          const totalDue = Number(inv.investment_amount) + cashReturn
          const isSpecial = inv.is_special
          const pendingCash = isSpecial ? totalDue - totalPabloW : totalDue

          return (
            <div
              key={inv.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${isSpecial ? 'border-orange-200' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{isSpecial ? '⭐' : '👤'}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{inv.name}</p>
                    {isSpecial && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Acceso al costo
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-500">{pct(share)} del pool</span>
              </div>

              <div className="space-y-2">
                <Row label="Inversión" value={formatARS(inv.investment_amount)} />
                <Row label="Ganancia a recibir" value={formatARS(cashReturn)} highlight={cashReturn > 0} />
                {isSpecial && totalPabloW > 0 && (
                  <>
                    <Row
                      label={`Bienes ya recibidos al costo (${pabloQty} uds.)`}
                      value={`− ${formatARS(totalPabloW)}`}
                      badge="Ya recibido"
                    />
                    <Row
                      label="Efectivo pendiente a recibir"
                      value={formatARS(pendingCash)}
                      highlight={pendingCash > 0}
                    />
                  </>
                )}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <Row
                    label={isSpecial && totalPabloW > 0 ? 'Total a recuperar (bienes + efectivo)' : 'Total a recuperar'}
                    value={formatARS(totalDue)}
                    bold
                  />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Retiro de Pablo */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Retiro de Pablo al costo</h3>
          <button
            onClick={() => { setShowForm(!showForm); setFormSuccess(false) }}
            className="text-sm text-orange-600 font-semibold"
          >
            {showForm ? 'Cancelar' : '+ Registrar retiro'}
          </button>
        </div>

        {formSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
            <p className="text-green-700 font-medium text-sm">✓ Retiro registrado</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleWithdrawal} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de producto</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'stickers', label: '🃏 Figuritas' },
                  { value: 'album', label: '📔 Álbum' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProductType(opt.value)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      productType === opt.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 10"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Precio costo por unidad (ARS)</label>
              <input
                type="number"
                min="1"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ej: 5000"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {withdrawalTotal > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs text-orange-600 font-medium">Total al costo</p>
                <p className="text-2xl font-bold text-orange-800">{formatARS(withdrawalTotal)}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Registrar Retiro'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, highlight, bold, badge }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <span className={`text-sm font-semibold ${highlight ? 'text-green-700' : bold ? 'text-gray-900' : 'text-gray-700'}`}>
          {value}
        </span>
      </div>
    </div>
  )
}
