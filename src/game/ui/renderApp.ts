import { appConfig } from '@/config/env'
import { GAME, VOC_TAGS } from '@/data/constants'
import { ENEMIES } from '@/data/enemies'
import { TOWER_ORDER, TOWERS, towerStats } from '@/data/towers'
import { getWave } from '@/data/waves'
import { createGame } from '@/game/createGame'
import { GameRuntime } from '@/game/runtime/GameRuntime'
import type { PlayScene } from '@/game/scenes/PlayScene'
import { playLogService } from '@/services/playLog'
import {
  hasCompletedTutorial,
  markTutorialCompleted,
  resetTutorialProgress,
  TUTORIAL_STEPS,
  type TutorialStepId,
} from '@/services/tutorial'
import { vocService } from '@/services/voc'
import type { TowerId } from '@/types'

type GameInstance = ReturnType<typeof createGame>
type Screen = 'title' | 'play' | 'result'

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="app">
      <div id="screen-title" class="screen screen-title"></div>
      <div id="screen-play" class="screen screen-play hidden">
        <header class="hud" id="hud"></header>
        <div class="play-layout">
          <div id="game-container" class="game-container"></div>
          <aside class="side-panel" id="side-panel"></aside>
        </div>
        <div id="tutorial" class="tutorial hidden"></div>
        <div id="pause-overlay" class="overlay hidden"></div>
      </div>
      <div id="screen-result" class="screen screen-result hidden"></div>
    </div>
  `

  let runtime: GameRuntime | null = null
  let game: GameInstance | null = null
  let playScene: PlayScene | null = null
  let selectedSlotId: string | null = null
  let selectedTowerId: string | null = null
  let tutorialOn = false
  let tutorialStep: TutorialStepId = 'runway'
  let forceTutorial = false
  let lastResult: 'won' | 'lost' = 'lost'
  let vocSubmitted = false
  let lastHudKey = ''
  let lastPanelKey = ''

  const el = {
    title: root.querySelector<HTMLElement>('#screen-title')!,
    play: root.querySelector<HTMLElement>('#screen-play')!,
    result: root.querySelector<HTMLElement>('#screen-result')!,
    hud: root.querySelector<HTMLElement>('#hud')!,
    side: root.querySelector<HTMLElement>('#side-panel')!,
    tutorial: root.querySelector<HTMLElement>('#tutorial')!,
    pause: root.querySelector<HTMLElement>('#pause-overlay')!,
    gameContainer: root.querySelector<HTMLElement>('#game-container')!,
  }

  function show(next: Screen): void {
    el.title.classList.toggle('hidden', next !== 'title')
    el.play.classList.toggle('hidden', next !== 'play')
    el.result.classList.toggle('hidden', next !== 'result')
  }

  function renderTitle(): void {
    el.title.innerHTML = `
      <section class="title-hero">
        <p class="eyebrow">Startup Tower Defense</p>
        <h1>${appConfig.title}</h1>
        <p class="lede">Customer Inbox에서 Product Core까지, 10웨이브 동안 Runway를 지키세요.</p>
        <div class="cta-row">
          <button type="button" class="btn primary" data-action="start">Start Game</button>
          <button type="button" class="btn ghost" data-action="howto">How to Play</button>
        </div>
        <div class="title-meta">
          <button type="button" class="linkish" data-action="replay-tutorial">튜토리얼 다시보기</button>
          <span>데스크톱 브라우저 · ${GAME.TOTAL_WAVES} Waves</span>
        </div>
        <div id="howto-box" class="howto hidden">
          <h2>How to Play</h2>
          <ol>
            <li>빈 슬롯에 타워를 설치하고 Budget을 관리하세요.</li>
            <li>Start Wave로 적을 스폰하고 Product Core를 방어하세요.</li>
            <li>Runway가 0이면 패배, 10웨이브 보스 처치 시 승리합니다.</li>
            <li>종료 후 VOC를 남겨 개선 근거를 남겨주세요.</li>
          </ol>
        </div>
      </section>
    `
    el.title.querySelector('[data-action="start"]')?.addEventListener('click', () => {
      startGame(false)
    })
    el.title.querySelector('[data-action="howto"]')?.addEventListener('click', () => {
      el.title.querySelector('#howto-box')?.classList.toggle('hidden')
    })
    el.title.querySelector('[data-action="replay-tutorial"]')?.addEventListener('click', () => {
      resetTutorialProgress()
      forceTutorial = true
      startGame(true)
    })
  }

  function destroyGame(): void {
    if (game) {
      game.destroy(true)
      game = null
    }
    playScene = null
    runtime = null
    el.gameContainer.innerHTML = ''
  }

  function syncSelection(): void {
    if (!playScene) return
    const sel = playScene.getSelection()
    selectedSlotId = sel.slotId
    selectedTowerId = sel.towerId
  }

  function startGame(fromTutorialButton: boolean): void {
    destroyGame()
    runtime = new GameRuntime()
    runtime.startSession()
    selectedSlotId = null
    selectedTowerId = null
    vocSubmitted = false
    lastHudKey = ''
    lastPanelKey = ''
    tutorialOn = fromTutorialButton || forceTutorial || !hasCompletedTutorial()
    forceTutorial = false
    tutorialStep = 'runway'
    show('play')
    renderPause(false)

    game = createGame(el.gameContainer, runtime, {
      onHud: () => {
        if (game) playScene = game.scene.getScene('PlayScene') as PlayScene
        renderHud()
      },
      onPanel: () => {
        if (game) playScene = game.scene.getScene('PlayScene') as PlayScene
        syncSelection()
        renderSide()
        renderTutorial()
      },
      onGameOver: (result) => {
        lastResult = result
        runtime?.persistLogs(result)
        window.setTimeout(() => renderResult(), 400)
      },
      onTutorialEvent: (event) => {
        advanceTutorial(event)
      },
    })

    window.setTimeout(() => {
      if (game) playScene = game.scene.getScene('PlayScene') as PlayScene
      syncSelection()
      renderHud()
      renderSide()
      renderTutorial()
    }, 0)
  }

  function advanceTutorial(event: string): void {
    if (!tutorialOn) return
    if (tutorialStep === 'place_developer' && event === 'tower_placed') {
      tutorialStep = 'start_wave'
    } else if (tutorialStep === 'start_wave' && event === 'wave_started') {
      tutorialStep = 'earn_budget'
    } else if (tutorialStep === 'earn_budget' && event === 'enemy_defeated') {
      tutorialStep = 'roles'
    } else if (tutorialStep === 'roles' && event === 'dismiss') {
      tutorialOn = false
      markTutorialCompleted()
    } else if (tutorialStep === 'runway' && event === 'next') {
      tutorialStep = 'place_developer'
    }
    renderTutorial()
  }

  function renderHud(): void {
    if (!runtime) return
    const s = runtime.getSnapshot()
    const key = [
      s.runway,
      s.budget,
      s.wave,
      s.remainingEnemies,
      s.score,
      s.speed,
      s.paused,
      s.phase,
      s.founderAbilityAvailable,
    ].join('|')
    if (key === lastHudKey && el.hud.childElementCount > 0) return
    lastHudKey = key
    el.hud.innerHTML = `
      <div class="hud-left">
        <strong class="brand-mini">${appConfig.title}</strong>
        <span>Runway <b>${s.runway}/${s.maxRunway}</b></span>
        <span>Budget <b>${s.budget}</b></span>
        <span>Wave <b>${s.wave}/${GAME.TOTAL_WAVES}</b></span>
        <span>Enemies <b>${s.remainingEnemies}</b></span>
        <span>Score <b>${s.score}</b></span>
      </div>
      <div class="hud-right">
        <button type="button" class="btn tiny" data-hud="speed">${s.speed}x</button>
        <button type="button" class="btn tiny" data-hud="pause">${s.paused ? 'Resume' : 'Pause'}</button>
        <button type="button" class="btn tiny accent" data-hud="wave" ${
          s.phase === 'ready' && !s.paused ? '' : 'disabled'
        }>Start Wave</button>
        <button type="button" class="btn tiny" data-hud="allhands" ${
          s.founderAbilityAvailable && s.phase === 'combat' && !s.paused ? '' : 'disabled'
        }>All Hands</button>
      </div>
    `
    el.hud.querySelector('[data-hud="speed"]')?.addEventListener('click', () => {
      runtime?.toggleSpeed()
      renderHud()
    })
    el.hud.querySelector('[data-hud="pause"]')?.addEventListener('click', () => {
      if (!runtime) return
      runtime.setPaused(!runtime.paused)
      renderPause(runtime.paused)
      renderHud()
    })
    el.hud.querySelector('[data-hud="wave"]')?.addEventListener('click', () => {
      runtime?.startWave()
    })
    el.hud.querySelector('[data-hud="allhands"]')?.addEventListener('click', () => {
      runtime?.useFounderAbility()
    })
  }

  function renderSide(): void {
    if (!runtime) return
    const s = runtime.getSnapshot()
    const wave = getWave(Math.min(s.wave, GAME.TOTAL_WAVES))
    const selectedTower = selectedTowerId
      ? runtime.towers.find((t) => t.id === selectedTowerId)
      : null

    const panelKey = [
      selectedSlotId,
      selectedTowerId,
      selectedTower?.level,
      s.budget,
      s.phase,
      s.paused,
      s.wave,
      runtime.towers.length,
    ].join('|')
    if (panelKey === lastPanelKey && el.side.childElementCount > 0) return
    lastPanelKey = panelKey

    const nextPreview = wave.spawns.map((g) => `${ENEMIES[g.enemyId].name} ×${g.count}`).join(', ')

    let body: string
    if (selectedSlotId && !selectedTower) {
      body = `
        <h2>타워 설치</h2>
        <p class="muted">슬롯 ${selectedSlotId}</p>
        <div class="tower-list">
          ${TOWER_ORDER.map((id) => {
            const def = TOWERS[id]
            const cost = towerStats(id, 1).cost
            const blocked =
              s.budget < cost || Boolean(def.maxCount && runtime!.hasFounder() && id === 'founder')
            return `
              <button type="button" class="tower-card" data-place="${id}" ${blocked ? 'disabled' : ''}>
                <span class="swatch" style="background:${def.color}"></span>
                <span>
                  <strong>${def.name}</strong>
                  <small>${def.role}</small>
                </span>
                <b>${cost}</b>
              </button>
            `
          }).join('')}
        </div>
        <button type="button" class="btn ghost full" data-action="cancel">취소</button>
      `
    } else if (selectedTower) {
      const def = TOWERS[selectedTower.type]
      const cur = towerStats(selectedTower.type, selectedTower.level)
      const next =
        selectedTower.level < GAME.MAX_TOWER_LEVEL
          ? towerStats(selectedTower.type, selectedTower.level + 1)
          : null
      const refund = Math.floor(selectedTower.spent * GAME.SELL_REFUND_RATE)
      body = `
        <h2>${def.name}</h2>
        <p class="muted">Lv.${selectedTower.level} · ${def.role}</p>
        <ul class="stat-list">
          <li><span>공격력</span><b>${cur.damage || '-'}</b></li>
          <li><span>사거리</span><b>${cur.range || cur.supportRange || '-'}</b></li>
          <li><span>주기</span><b>${
            cur.damage ? `${(cur.attackIntervalMs / 1000).toFixed(2)}s` : '-'
          }</b></li>
          <li><span>누적비용</span><b>${selectedTower.spent}</b></li>
        </ul>
        <button type="button" class="btn primary full" data-action="upgrade" ${
          !next || s.budget < next.cost || s.paused ? 'disabled' : ''
        }>
          ${next ? `업그레이드 (${next.cost})` : '최대 레벨'}
        </button>
        <button type="button" class="btn danger full" data-action="sell" ${
          s.paused ? 'disabled' : ''
        }>판매 (환급 ${refund})</button>
        <button type="button" class="btn ghost full" data-action="cancel">닫기</button>
      `
    } else {
      body = `
        <h2>웨이브 정보</h2>
        <p class="muted">${s.phase === 'ready' ? '다음' : '현재'} 웨이브 ${wave.wave}</p>
        <p>${nextPreview}</p>
        ${wave.introEnemy ? `<p class="badge">NEW: ${ENEMIES[wave.introEnemy].name}</p>` : ''}
        <h3>타워 안내</h3>
        <div class="tower-list compact">
          ${TOWER_ORDER.map((id) => {
            const def = TOWERS[id]
            return `<div class="tower-card static"><span class="swatch" style="background:${def.color}"></span><span><strong>${def.name}</strong><small>${def.role}</small></span><b>${towerStats(id, 1).cost}</b></div>`
          }).join('')}
        </div>
        <p class="hint-sm">빈 슬롯을 클릭해 타워를 설치하세요.</p>
      `
    }

    el.side.innerHTML = body
    el.side.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.place as TowerId
        playScene?.placeTower(type)
      })
    })
    el.side.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      playScene?.clearSelection()
    })
    el.side.querySelector('[data-action="upgrade"]')?.addEventListener('click', () => {
      if (!selectedTowerId) return
      runtime?.upgradeTower(selectedTowerId)
    })
    el.side.querySelector('[data-action="sell"]')?.addEventListener('click', () => {
      if (!selectedTowerId) return
      if (!confirm('이 타워를 판매할까요?')) return
      runtime?.sellTower(selectedTowerId)
      playScene?.clearSelection()
    })
  }

  function renderTutorial(): void {
    if (!tutorialOn) {
      el.tutorial.classList.add('hidden')
      el.tutorial.innerHTML = ''
      return
    }
    const step = TUTORIAL_STEPS.find((s) => s.id === tutorialStep)!
    el.tutorial.classList.remove('hidden')
    el.tutorial.innerHTML = `
      <div class="tutorial-card">
        <p>${step.text}</p>
        <div class="cta-row">
          ${
            tutorialStep === 'runway' || tutorialStep === 'roles'
              ? `<button type="button" class="btn primary" data-tut="next">${
                  tutorialStep === 'roles' ? '시작하기' : '다음'
                }</button>`
              : `<span class="muted">안내된 행동을 수행하세요</span>`
          }
          <button type="button" class="btn ghost" data-tut="skip">건너뛰기</button>
        </div>
      </div>
    `
    el.tutorial.querySelector('[data-tut="next"]')?.addEventListener('click', () => {
      if (tutorialStep === 'roles') advanceTutorial('dismiss')
      else advanceTutorial('next')
    })
    el.tutorial.querySelector('[data-tut="skip"]')?.addEventListener('click', () => {
      tutorialOn = false
      markTutorialCompleted()
      renderTutorial()
    })
  }

  function renderPause(showPause: boolean): void {
    if (!showPause) {
      el.pause.classList.add('hidden')
      el.pause.innerHTML = ''
      return
    }
    el.pause.classList.remove('hidden')
    el.pause.innerHTML = `
      <div class="modal">
        <h2>일시정지</h2>
        <div class="cta-col">
          <button type="button" class="btn primary" data-pause="resume">Resume</button>
          <button type="button" class="btn" data-pause="restart">Restart</button>
          <button type="button" class="btn" data-pause="howto">How to Play</button>
          <button type="button" class="btn ghost" data-pause="exit">Exit</button>
        </div>
      </div>
    `
    el.pause.querySelector('[data-pause="resume"]')?.addEventListener('click', () => {
      runtime?.setPaused(false)
      renderPause(false)
      renderHud()
    })
    el.pause.querySelector('[data-pause="restart"]')?.addEventListener('click', () => {
      startGame(false)
    })
    el.pause.querySelector('[data-pause="howto"]')?.addEventListener('click', () => {
      alert('슬롯에 타워 설치 → Start Wave → Runway 사수. 판매 환급 70%, 최대 레벨 3, 배속 1x/2x.')
    })
    el.pause.querySelector('[data-pause="exit"]')?.addEventListener('click', () => {
      destroyGame()
      show('title')
      renderTitle()
    })
  }

  function renderResult(): void {
    if (!runtime) return
    const meta = runtime.buildSessionMeta(lastResult)
    show('result')
    const mins = Math.floor(meta.playTimeMs / 60000)
    const secs = Math.floor((meta.playTimeMs % 60000) / 1000)
    el.result.innerHTML = `
      <section class="result-card">
        <p class="eyebrow">${lastResult === 'won' ? 'Victory' : 'Defeat'}</p>
        <h1>${lastResult === 'won' ? 'Product-Market Fit!' : 'Runway Depleted'}</h1>
        <ul class="result-stats">
          <li><span>점수</span><b>${meta.finalScore}</b></li>
          <li><span>도달 웨이브</span><b>${meta.reachedWave}/${GAME.TOTAL_WAVES}</b></li>
          <li><span>남은 Runway</span><b>${meta.remainingRunway}</b></li>
          <li><span>플레이 시간</span><b>${mins}:${secs.toString().padStart(2, '0')}</b></li>
          <li><span>제거/놓침</span><b>${meta.enemiesDefeated}/${meta.enemiesLeaked}</b></li>
          <li><span>최다 타워</span><b>${
            meta.mostUsedTower ? TOWERS[meta.mostUsedTower].name : '-'
          }</b></li>
        </ul>
        <div class="voc-box">
          <h2>어떻게 개선하면 좋을까요?</h2>
          <div class="tags" id="voc-tags">
            ${VOC_TAGS.map(
              (tag) => `<button type="button" class="tag" data-tag="${tag}">${tag}</button>`,
            ).join('')}
          </div>
          <textarea id="voc-text" rows="3" placeholder="자유롭게 의견을 남겨주세요"></textarea>
          <button type="button" class="btn primary full" id="voc-submit" ${
            vocSubmitted ? 'disabled' : ''
          }>${vocSubmitted ? '제출 완료' : 'VOC 제출'}</button>
          <p class="voc-feedback" id="voc-feedback"></p>
        </div>
        <div class="cta-row">
          <button type="button" class="btn primary" data-result="retry">Retry</button>
          <button type="button" class="btn ghost" data-result="title">타이틀로</button>
        </div>
      </section>
    `

    const selected = new Set<string>()
    el.result.querySelectorAll<HTMLButtonElement>('[data-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag!
        if (selected.has(tag)) {
          selected.delete(tag)
          btn.classList.remove('active')
        } else {
          selected.add(tag)
          btn.classList.add('active')
        }
      })
    })

    el.result.querySelector('#voc-submit')?.addEventListener('click', () => {
      if (!runtime || vocSubmitted) return
      const text = el.result.querySelector<HTMLTextAreaElement>('#voc-text')!.value.trim()
      const feedback = el.result.querySelector<HTMLElement>('#voc-feedback')!
      if (!text && selected.size === 0) {
        feedback.textContent = '태그 또는 텍스트를 입력해 주세요.'
        return
      }
      const metaNow = runtime.buildSessionMeta(lastResult)
      const res = vocService.submit({
        sessionId: metaNow.sessionId,
        text,
        tags: [...selected],
        submittedAt: Date.now(),
        meta: metaNow,
      })
      if (!res.ok) {
        feedback.textContent = res.error
        return
      }
      playLogService.log({
        type: 'VocSubmitted',
        sessionId: metaNow.sessionId,
        at: Date.now(),
        wave: metaNow.reachedWave,
        budget: runtime.budget,
        runway: runtime.runway,
        payload: { tags: [...selected], textLength: text.length },
      })
      playLogService.persistSession(metaNow)
      vocSubmitted = true
      feedback.textContent = '제출되었습니다. 감사합니다!'
      const btn = el.result.querySelector<HTMLButtonElement>('#voc-submit')
      if (btn) {
        btn.disabled = true
        btn.textContent = '제출 완료'
      }
    })

    el.result.querySelector('[data-result="retry"]')?.addEventListener('click', () => {
      startGame(false)
    })
    el.result.querySelector('[data-result="title"]')?.addEventListener('click', () => {
      destroyGame()
      show('title')
      renderTitle()
    })
  }

  renderTitle()
  show('title')
}
