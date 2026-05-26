import { useState } from 'react'
import ProgressIndicator from './components/ProgressIndicator'
import BrainDumpScreen from './components/BrainDumpScreen'
import EnergyScreen from './components/EnergyScreen'
import ConstraintsScreen from './components/ConstraintsScreen'
import ResultsScreen from './components/ResultsScreen'
import ParkingLot from './components/ParkingLot'
import { generateDayPlan } from './services/anthropicService'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState(0)
  const [brainDump, setBrainDump] = useState('')
  const [energy, setEnergy] = useState(null)
  const [constraints, setConstraints] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleEnergySelect = (level) => {
    setEnergy(level)
    setScreen(2)
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await generateDayPlan({ brainDump, energy, constraints })
      setResults(data)
      setScreen(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setScreen(0)
    setBrainDump('')
    setEnergy(null)
    setConstraints('')
    setResults(null)
    setError(null)
  }

  const currentContent = [
    <BrainDumpScreen
      value={brainDump}
      onChange={setBrainDump}
      onNext={() => setScreen(1)}
    />,
    <EnergyScreen onSelect={handleEnergySelect} />,
    <ConstraintsScreen
      value={constraints}
      onChange={setConstraints}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      error={error}
    />,
    <ResultsScreen results={results} onReset={handleReset} />,
  ][screen]

  return (
    <div className="app">
      {screen < 3 && <ProgressIndicator current={screen} total={3} />}

      <main className="screen-container">
        <div key={screen} className="screen-wrapper">
          {currentContent}
        </div>
      </main>

      <ParkingLot />
    </div>
  )
}
