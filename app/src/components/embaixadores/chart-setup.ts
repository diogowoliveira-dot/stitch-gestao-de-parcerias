// src/components/embaixadores/chart-setup.ts
// Registers Chart.js once at module level so ChartLine and ChartBar
// don't call Chart.register(...registerables) on every effect run.
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
export { Chart }
