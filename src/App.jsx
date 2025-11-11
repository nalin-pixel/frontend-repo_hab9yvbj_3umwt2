import { useEffect, useMemo, useState } from 'react'

function App() {
  const baseUrl = useMemo(() => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  }, [])

  const [pair, setPair] = useState({ device_id: '', device_name: '' })
  const [pairs, setPairs] = useState([])
  const [text, setText] = useState('ইউটিউবে লালন গীত প্লে করো')
  const [language, setLanguage] = useState('bn')
  const [deviceId, setDeviceId] = useState('')
  const [planning, setPlanning] = useState(false)
  const [planned, setPlanned] = useState(null)
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    refreshPairs()
    refreshHistory()
  }, [])

  const refreshPairs = async () => {
    try {
      const res = await fetch(`${baseUrl}/pairs`)
      const data = await res.json()
      setPairs(data)
    } catch (e) {
      // ignore
    }
  }

  const refreshHistory = async () => {
    try {
      const res = await fetch(`${baseUrl}/history`)
      const data = await res.json()
      setHistory(data.reverse())
    } catch (e) {
      // ignore
    }
  }

  const doPair = async () => {
    if (!pair.device_id) {
      setStatus('Please enter a device ID')
      return
    }
    setStatus('Pairing...')
    try {
      const res = await fetch(`${baseUrl}/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pair),
      })
      if (!res.ok) throw new Error('Failed to pair')
      setStatus('Paired successfully')
      setDeviceId(pair.device_id)
      setPair({ device_id: '', device_name: '' })
      refreshPairs()
    } catch (e) {
      setStatus(`Pair failed: ${e.message}`)
    }
  }

  const plan = async () => {
    if (!text.trim()) return
    setPlanning(true)
    setPlanned(null)
    setStatus('Planning...')
    try {
      const res = await fetch(`${baseUrl}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, device_id: deviceId || null }),
      })
      if (!res.ok) throw new Error('Failed to plan')
      const data = await res.json()
      setPlanned(data)
      setStatus('Planned ✅')
      refreshHistory()
    } catch (e) {
      setStatus(`Plan failed: ${e.message}`)
    } finally {
      setPlanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Phone Control AI</h1>
            <p className="text-gray-600">বলুন কি করবেন — অ্যাপটি অ্যাকশন প্ল্যান তৈরি করবে</p>
          </div>
          <span className="text-xs text-gray-500 bg-white/70 rounded px-2 py-1 border">Backend: {baseUrl}</span>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">কমান্ড দিন</h2>
            <div className="space-y-3">
              <textarea
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ring-indigo-300"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="যেমন: মায়েরে কল দাও / Open YouTube and play lo-fi"
              />
              <div className="flex gap-3 items-center">
                <select
                  className="border rounded px-3 py-2"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="bn">Bangla</option>
                  <option value="en">English</option>
                </select>
                <input
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Optional: Device ID"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
                <button
                  onClick={plan}
                  disabled={planning}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                >
                  {planning ? 'Planning...' : 'Create Plan'}
                </button>
              </div>
              {status && <p className="text-sm text-gray-600">{status}</p>}
            </div>

            {planned && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Planned Actions</h3>
                <ul className="space-y-2">
                  {planned.actions?.map((a, idx) => (
                    <li key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{a.type}</p>
                        {a.target && <p className="text-sm text-gray-600">Target: {a.target}</p>}
                        {a.args && Object.keys(a.args).length > 0 && (
                          <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(a.args, null, 2)}</pre>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{a.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-3">ডিভাইস পেয়ার</h2>
              <div className="space-y-2">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Device ID (যেমন: phone-123)"
                  value={pair.device_id}
                  onChange={(e) => setPair(p => ({ ...p, device_id: e.target.value }))}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Device Name (ঐচ্ছিক)"
                  value={pair.device_name}
                  onChange={(e) => setPair(p => ({ ...p, device_name: e.target.value }))}
                />
                <button onClick={doPair} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2">
                  Pair Device
                </button>
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Paired Devices</h3>
                <ul className="space-y-1 max-h-40 overflow-auto">
                  {pairs.length === 0 && <li className="text-sm text-gray-500">No pairs yet</li>}
                  {pairs.map((p) => (
                    <li key={p._id} className="text-sm flex items-center justify-between">
                      <span>{p.device_name || 'Unnamed'} — <span className="font-mono text-gray-600">{p.device_id}</span></span>
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => setDeviceId(p.device_id)}
                      >Use</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-3">History</h2>
              <ul className="space-y-3 max-h-80 overflow-auto">
                {history.length === 0 && <li className="text-sm text-gray-500">No history</li>}
                {history.map(item => (
                  <li key={item._id} className="border rounded-lg p-3">
                    <p className="font-medium">{item.text}</p>
                    <p className="text-xs text-gray-500">intent: {item.intent || 'unknown'} | device: {item.device_id || '—'}</p>
                    {Array.isArray(item.actions) && item.actions.length > 0 && (
                      <ul className="mt-2 text-sm list-disc pl-5 text-gray-700">
                        {item.actions.map((a, i) => (
                          <li key={i}>{a.type}{a.target ? ` → ${a.target}` : ''}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <footer className="mt-10 text-center text-xs text-gray-500">
          নিরাপত্তা টিপ: এই প্রোটোটাইপ শুধু অ্যাকশন প্ল্যান তৈরি করে। ফোন নিয়ন্ত্রণের জন্য আলাদা অ্যাপ দরকার (Accessibility Service + WebSocket)।
        </footer>
      </div>
    </div>
  )
}

export default App
