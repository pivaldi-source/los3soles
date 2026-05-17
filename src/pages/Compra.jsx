import { useState } from 'react'
import { supabase } from '../lib/supabase'

const formatARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function Compra() {
  const [productType, setProductType] = useState('stickers')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const total = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: dbError } = await supabase.from('transactions').insert({
      type: 'purchase',
      product_type: productType,
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      total_price: total,
    })

    setLoading(false)
    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.')
    } else {
      setSuccess(true)
      setQuantity('')
      setUnitPrice('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nueva Compra</h2>
        <p className="text-gray-500 text-sm mt-1">Registrá el ingreso de mercadería</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de producto</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'stickers', label: '🃏 Figuritas', sub: 'Paquetes' },
              { value: 'album', label: '📔 Álbum', sub: 'Álbumes completos' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProductType(opt.value)}
                className={`py-3 px-4 rounded-xl border-2 text-left transition-colors ${
                  productType === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.sub}</p>
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
            placeholder="Ej: 100"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Precio por unidad (ARS)</label>
          <input
            type="number"
            min="1"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Ej: 5000"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {total > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600 font-medium">Total a pagar</p>
            <p className="text-2xl font-bold text-blue-800">{formatARS(total)}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-700 font-medium text-sm">✓ Compra registrada correctamente</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Registrar Compra'}
        </button>
      </form>
    </div>
  )
}
