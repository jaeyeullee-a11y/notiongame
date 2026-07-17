import './styles/global.css'
import { mountApp } from '@/game/ui/renderApp'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) {
  throw new Error('#app root element is missing')
}

mountApp(root)
