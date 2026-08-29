import { createRoot } from 'react-dom/client'
import { isWorkshopRoute } from '@/quiz/route'
import '@/styles/global.css'

const root = createRoot(document.getElementById('root')!)

if (isWorkshopRoute(window.location.pathname, window.location.hash)) {
  void import('@/quiz/QuizApp').then(({ default: QuizApp }) => {
    root.render(<QuizApp />)
  })
} else {
  void import('@/app/App').then(({ default: App }) => {
    root.render(<App />)
  })
}
