import './styles/global.css'
import { appConfig } from './config/env'

/**
 * Bootstrap entry only.
 * Game scenes, combat loop, and VOC flows are intentionally not implemented yet.
 */
function renderBootstrapShell(): void {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) {
    throw new Error('#app root element is missing')
  }

  root.innerHTML = `
    <main class="shell">
      <section class="panel" aria-labelledby="brand">
        <h1 id="brand" class="brand">${appConfig.title}</h1>
        <p class="tagline">프로젝트 초기 세팅 완료. 게임 로직은 아직 연결되지 않았습니다.</p>
        <ul class="status">
          <li><span>환경</span><strong>${appConfig.env}</strong></li>
          <li><span>VOC 제출</span><strong>${appConfig.features.vocSubmit ? 'ON' : 'OFF'}</strong></li>
          <li><span>플레이 로그</span><strong>${appConfig.features.playLog ? 'ON' : 'OFF'}</strong></li>
        </ul>
        <p class="hint">개발 서버: <code>npm run dev</code> · 문서: <code>README.md</code></p>
      </section>
    </main>
  `
}

renderBootstrapShell()
