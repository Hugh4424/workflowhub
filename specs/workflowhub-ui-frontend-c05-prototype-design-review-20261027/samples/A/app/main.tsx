import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SimulationBoard from '../components/SimulationBoard';
import SimWorkbench from '../components/SimWorkbench';

function App() {
  const [view, setView] = useState(location.hash);
  useEffect(() => {
    const change = () => setView(location.hash);
    addEventListener('hashchange', change);
    return () => removeEventListener('hashchange', change);
  }, []);
  return view.startsWith('#workbench') ? <SimWorkbench key={view} /> : <SimulationBoard key={view} />;
}
createRoot(document.getElementById('root')!).render(<App />);
