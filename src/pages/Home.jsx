import { useNavigate } from 'react-router-dom'

const sections = [
  {
    path: '/compra',
    label: 'Compra',
    icon: '📦',
    description: 'Registrar paquetes o álbumes comprados',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    text: 'text-blue-800',
    sub: 'text-blue-600',
  },
  {
    path: '/venta',
    label: 'Venta',
    icon: '💰',
    description: 'Registrar paquetes o álbumes vendidos',
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    text: 'text-green-800',
    sub: 'text-green-600',
  },
  {
    path: '/estadisticas',
    label: 'Estadísticas',
    icon: '📊',
    description: 'Ver totales, inversión y ganancia',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    text: 'text-purple-800',
    sub: 'text-purple-600',
  },
  {
    path: '/inversores',
    label: 'Inversores',
    icon: '🤝',
    description: 'Detalle de retornos por inversor',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    text: 'text-orange-800',
    sub: 'text-orange-600',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-500 text-sm">Gestioná las operaciones del negocio</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map((s) => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className={`${s.bg} ${s.border} border-2 rounded-2xl p-5 text-left flex flex-col gap-3 active:scale-95 transition-transform`}
          >
            <div className={`${s.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
              {s.icon}
            </div>
            <div>
              <p className={`font-bold text-lg leading-tight ${s.text}`}>{s.label}</p>
              <p className={`text-xs mt-1 leading-snug ${s.sub}`}>{s.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
