export const getTransactions = () =>
  fetch('/api/transactions').then((r) => r.json())

export const getInvestors = () =>
  fetch('/api/investors').then((r) => r.json())

export const createTransaction = (data) =>
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) throw new Error('Error al guardar')
    return r.json()
  })
