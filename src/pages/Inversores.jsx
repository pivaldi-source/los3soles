import { useEffect, useState } from 'react'
import { getTransactions, getInvestors, createTransaction } from '../lib/api'

const formatARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const pct = (n) => `${(n * 100).toFixed(1)}%`

export default function Inversores() {
  const [investors, setInvestors] = useState([])
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(true)

  // Formulario de retiro: guarda el investor_id del que está registrando, o null si está cerrado
  const [showFormFor, setShowFormFor] = useState(null)
  const [productType, setProductType] = useState('stickers')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [formSuccess, setFormSuccess] = useState(null) // investor_id del último éxito

  const withdrawalTotal = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0

  async function load() {
    const [invRows, txRows] = await Promise.all([getInvestors(), getTransactions()])
    if (!invRows || !txRows) return

    const purchases = txRows.filter((r) => r.type === 'purchase')
    const sales = txRows.filter((r) => r.type === 'sale')
    const withdrawals = txRows.filter((r) => r.type === 'withdrawal')

    const sum = (arr) => arr.reduce((acc, r) => acc + Number(r.total_price), 0)
    const sumQty = (arr) => arr.reduce((acc, r) => acc + Number(r.quantity), 0)

    const totalInvested = invRows.reduce((acc, i) => acc + Number(i.investment_amount), 0)
    const totalPurchased = sum(purchases)
    const totalSold = sum(sales)
    const grossProfit = totalSold - totalPurchased
    const investorPool = grossProfit > 0 ? grossProfit * 0.5 : 0
    const businessPool = grossProfit > 0 ? grossProfit * 0.5 : 0
    const cajaDisponible = totalInvested + totalSold - totalPurchased

    // Retiros agrupados por inversor
    const withdrawalsByInvestor = {}
    for (const w of withdrawals) {
      if (!w.investor_id) continue
      if (!withdrawalsByInvestor[w.investor_id]) {
        withdrawalsByInvestor[w.investor_id] = { total: 0, qty: 0 }
      }
      withdrawalsByInvestor[w.investor_id].total += Number(w.total_price)
      withdrawalsByInvestor[w.investor_id].qty += Number(w.quantity)
    }

    // Total owed en cash a todos los inversores (para calcular cobrable hoy proporcional)
    const totalOwedInvestors = invRows.reduce((acc, inv) => {
      const share = Number(inv.investment_amount) / totalInvested
      const cashReturn = investorPool * share
      const myWithd = withdrawalsByInvestor[inv.id]?.total ?? 0
      return acc + Number(inv.investment_amount) + cashReturn - myWithd
    }, 0)

    // Caja disponible para pagar a inversores (el negocio retiene su pool de ganancia)
    const cajaParaInversores = Math.max(0, Math.min(totalOwedInvestors, cajaDisponible - businessPool))

    setInvestors(invRows)
    setFinancials({ grossProfit, investorPool, businessPool, totalInvested, withdrawalsByInvestor, cajaDisponible, totalOwedInvestors, cajaParaInversores })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openForm(investorId) {
    setShowFormFor(investorId)
    setFormSuccess(null)
    setProductType('stickers')
    setQuantity('')
    setUnitPrice('')
  }

  async function handleWithdrawal(e, investorId) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTransaction({
        type: 'withdrawal',
        investor_id: investorId,
        product_type: productType,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        total_price: withdrawalTotal,
      })
      setFormSuccess(investorId)
      setShowFormFor(null)
      setQuantity('')
      setUnitPrice('')
      await load()
    } catch {
      // silencioso
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 mt-10">Cargando...</p>
  if (!financials) return null

  const { grossProfit, investorPool, businessPool, totalInvested, withdrawalsByInvestor, cajaDisponible, totalOwedInvestors, cajaParaInversores } = financials

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
        <div className={`rounded-xl px-3 py-2 flex items-center justify-between ${cajaDisponible >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div>
            <p className={`text-xs font-medium ${cajaDisponible >= 0 ? 'text-green-700' : 'text-red-700'}`}>💵 Caja disponible</p>
            <p className="text-xs text-gray-500">Efectivo en mano ahora</p>
          </div>
          <p className={`font-bold text-lg ${cajaDisponible >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {formatARS(cajaDisponible)}
          </p>
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
          const myWithdrawals = withdrawalsByInvestor[inv.id] ?? { total: 0, qty: 0 }
          const pendingCash = totalDue - myWithdrawals.total
          const cobrableHoy = totalOwedInvestors > 0
            ? (pendingCash / totalOwedInvestors) * cajaParaInversores
            : 0
          const isFormOpen = showFormFor === inv.id

          return (
            <div
              key={inv.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${isSpecial ? 'border-orange-200' : 'border-gray-100'}`}
            >
              {/* Encabezado */}
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

              {/* Filas financieras */}
              <div className="space-y-2">
                <Row label="Inversión" value={formatARS(inv.investment_amount)} />
                <Row label="Ganancia a recibir" value={formatARS(cashReturn)} highlight={cashReturn > 0} />

                {isSpecial && myWithdrawals.total > 0 && (
                  <>
                    <Row
                      label={`Bienes ya recibidos al costo (${myWithdrawals.qty} uds.)`}
                      value={`− ${formatARS(myWithdrawals.total)}`}
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
                    label={isSpecial && myWithdrawals.total > 0 ? 'Total a recuperar (bienes + efectivo)' : 'Total a recuperar'}
                    value={formatARS(totalDue)}
                    bold
                  />
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                    <Row
                      label="💵 Cobrable hoy (según caja)"
                      value={formatARS(cobrableHoy)}
                      highlight={cobrableHoy > 0}
                    />
                  </div>
                </div>
              </div>

              {/* Formulario de retiro al costo — solo inversores especiales */}
              {isSpecial && (
                <div className="mt-4">
                  {formSuccess === inv.id && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3">
                      <p className="text-green-700 font-medium text-sm">✓ Retiro registrado</p>
                    </div>
                  )}

                  {!isFormOpen ? (
                    <button
                      onClick={() => openForm(inv.id)}
                      className="w-full text-sm text-orange-600 font-semibold border border-orange-200 rounded-xl py-2 hover:bg-orange-50 transition-colors"
                    >
                      + Registrar retiro al costo
                    </button>
                  ) : (
                    <form onSubmit={(e) => handleWithdrawal(e, inv.id)} className="space-y-3 border-t border-orange-100 pt-4 mt-2">
                      <p className="text-sm font-semibold text-orange-700">Nuevo retiro al costo</p>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'stickers', label: '🃏 Figuritas' },
                          { value: 'album', label: '📔 Álbum' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setProductType(opt.value)}
                            className={`py-2 px-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                              productType === opt.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Cantidad"
                        required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="number"
                        min="1"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="Precio costo por unidad (ARS)"
                        required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />

                      {withdrawalTotal > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                          <p className="text-xs text-orange-600 font-medium">Total al costo</p>
                          <p className="text-xl font-bold text-orange-800">{formatARS(withdrawalTotal)}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFormFor(null)}
                          className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                        >
                          {saving ? 'Guardando...' : 'Registrar'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
