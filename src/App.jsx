import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compra from './pages/Compra'
import Venta from './pages/Venta'
import Estadisticas from './pages/Estadisticas'
import Inversores from './pages/Inversores'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="compra" element={<Compra />} />
          <Route path="venta" element={<Venta />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="inversores" element={<Inversores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
