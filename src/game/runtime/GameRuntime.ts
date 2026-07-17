import { GAME } from '@/data/constants'
import { ENEMIES } from '@/data/enemies'
import { PATH_TOTAL_LENGTH, positionAlongPath, SLOTS } from '@/data/map'
import { learnAttackSpeedBonus, TOWERS, towerStats, type TowerDef } from '@/data/towers'
import { getWave, waveClearBonus, waveEnemyTotal } from '@/data/waves'
import type { EnemyId, PlayEventType, SessionMeta, TowerId } from '@/types'
import { playLogService } from '@/services/playLog'
import { pickTarget } from '@/game/systems/targeting'
import type {
  FloatingText,
  GameSnapshot,
  RuntimeEnemy,
  RuntimeProjectile,
  RuntimeTower,
} from './types'

export type RuntimeListener = (event: string, payload?: unknown) => void

let seq = 0
function nid(prefix: string): string {
  seq += 1
  return `${prefix}_${seq}`
}

export class GameRuntime {
  sessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(16).slice(2)}`
  runway: number = GAME.START_RUNWAY
  maxRunway: number = GAME.START_RUNWAY
  budget: number = GAME.START_BUDGET
  wave = 1
  phase: GameSnapshot['phase'] = 'ready'
  speed: 1 | 2 = 1
  paused = false
  score = 0
  playTimeMs = 0
  enemiesDefeated = 0
  enemiesLeaked = 0
  founderAbilityUsed = false
  towersPlacedByType: Partial<Record<TowerId, number>> = {}

  enemies: RuntimeEnemy[] = []
  towers: RuntimeTower[] = []
  projectiles: RuntimeProjectile[] = []
  floaters: FloatingText[] = []

  private spawnQueue: Array<{ at: number; enemyId: EnemyId }> = []
  private waveClock = 0
  private listeners = new Set<RuntimeListener>()
  private toSpawnTotal = 0
  private spawnedCount = 0
  private bossDefeated = false

  on(listener: RuntimeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: string, payload?: unknown): void {
    for (const l of this.listeners) l(event, payload)
  }

  private log(type: PlayEventType, payload?: Record<string, unknown>): void {
    playLogService.log({
      type,
      sessionId: this.sessionId,
      at: Date.now(),
      wave: this.wave,
      budget: this.budget,
      runway: this.runway,
      payload,
    })
  }

  startSession(): void {
    playLogService.clear()
    this.log('GameStarted')
    this.emit('session_started')
  }

  getSnapshot(): GameSnapshot {
    const remaining =
      this.phase === 'combat'
        ? Math.max(0, this.toSpawnTotal - this.spawnedCount) +
          this.enemies.filter((e) => e.alive).length
        : this.phase === 'ready'
          ? waveEnemyTotal(this.wave)
          : 0

    return {
      runway: this.runway,
      maxRunway: this.maxRunway,
      budget: this.budget,
      wave: this.wave,
      phase: this.phase,
      remainingEnemies: remaining,
      score: this.score,
      speed: this.speed,
      paused: this.paused,
      founderAbilityAvailable: this.hasFounder() && !this.founderAbilityUsed,
      hasFounder: this.hasFounder(),
      enemiesDefeated: this.enemiesDefeated,
      enemiesLeaked: this.enemiesLeaked,
      playTimeMs: this.playTimeMs,
    }
  }

  hasFounder(): boolean {
    return this.towers.some((t) => t.type === 'founder')
  }

  setPaused(value: boolean): void {
    if (this.phase === 'won' || this.phase === 'lost') return
    this.paused = value
    this.emit('ui')
  }

  toggleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : 1
    this.emit('ui')
  }

  startWave(): boolean {
    if (this.paused || this.phase !== 'ready') return false
    const def = getWave(this.wave)
    this.spawnQueue = []
    this.waveClock = 0
    this.spawnedCount = 0
    this.toSpawnTotal = 0
    this.bossDefeated = false

    for (const group of def.spawns) {
      const start = group.startDelayMs ?? 0
      for (let i = 0; i < group.count; i += 1) {
        this.spawnQueue.push({
          at: start + i * group.intervalMs,
          enemyId: group.enemyId,
        })
        this.toSpawnTotal += 1
      }
    }
    this.spawnQueue.sort((a, b) => a.at - b.at)
    this.phase = 'combat'
    this.log('WaveStarted', { wave: this.wave, total: this.toSpawnTotal })
    this.emit('wave_started')
    this.emit('ui')
    return true
  }

  placeTower(slotId: string, type: TowerId): boolean {
    if (this.paused || this.phase === 'won' || this.phase === 'lost') return false
    const slot = SLOTS.find((s) => s.id === slotId)
    if (!slot) return false
    if (this.towers.some((t) => t.slotId === slotId)) return false

    const def = TOWERS[type]
    if (def.maxCount && this.towers.filter((t) => t.type === type).length >= def.maxCount) {
      return false
    }

    const cost = towerStats(type, 1).cost
    if (this.budget < cost) return false

    this.budget -= cost
    const tower: RuntimeTower = {
      id: nid('tower'),
      slotId,
      type,
      level: 1,
      x: slot.x,
      y: slot.y,
      spent: cost,
      cooldownMs: 0,
      kills: 0,
    }
    this.towers.push(tower)
    this.towersPlacedByType[type] = (this.towersPlacedByType[type] ?? 0) + 1
    this.log('TowerPlaced', { slotId, type, cost })
    this.emit('tower_placed', tower)
    this.emit('ui')
    return true
  }

  upgradeTower(towerId: string): boolean {
    if (this.paused || this.phase === 'won' || this.phase === 'lost') return false
    const tower = this.towers.find((t) => t.id === towerId)
    if (!tower || tower.level >= GAME.MAX_TOWER_LEVEL) return false
    const next = towerStats(tower.type, tower.level + 1)
    if (this.budget < next.cost) return false
    this.budget -= next.cost
    tower.spent += next.cost
    tower.level += 1
    this.log('TowerUpgraded', { towerId, type: tower.type, level: tower.level })
    this.emit('tower_upgraded', tower)
    this.emit('ui')
    return true
  }

  sellTower(towerId: string): boolean {
    if (this.paused || this.phase === 'won' || this.phase === 'lost') return false
    const idx = this.towers.findIndex((t) => t.id === towerId)
    if (idx < 0) return false
    const tower = this.towers[idx]!
    const refund = Math.floor(tower.spent * GAME.SELL_REFUND_RATE)
    this.budget += refund
    this.towers.splice(idx, 1)
    this.log('TowerSold', { towerId, type: tower.type, refund })
    this.emit('tower_sold', { tower, refund })
    this.emit('ui')
    return true
  }

  useFounderAbility(): boolean {
    if (this.paused || this.phase !== 'combat') return false
    if (this.founderAbilityUsed || !this.hasFounder()) return false
    this.founderAbilityUsed = true
    const until = this.playTimeMs + GAME.FOUNDER_FREEZE_MS
    for (const e of this.enemies) {
      if (e.alive) e.freezeUntil = Math.max(e.freezeUntil, until)
    }
    this.log('AbilityUsed', { ability: 'AllHands', durationMs: GAME.FOUNDER_FREEZE_MS })
    this.addFloater(GAME.WIDTH / 2, 80, 'All Hands!', '#f97316')
    this.emit('ability_used')
    this.emit('ui')
    return true
  }

  private addFloater(x: number, y: number, text: string, color: string): void {
    this.floaters.push({
      id: nid('fx'),
      x,
      y,
      text,
      color,
      lifeMs: 900,
    })
  }

  private spawnEnemy(type: EnemyId): void {
    const def = ENEMIES[type]
    const pos = positionAlongPath(0)
    const enemy: RuntimeEnemy = {
      id: nid('enemy'),
      type,
      hp: def.hp,
      maxHp: def.hp,
      distance: 0,
      x: pos.x,
      y: pos.y,
      alive: true,
      converted: false,
      slowUntil: 0,
      freezeUntil: 0,
      baseSpeed: def.speed,
      leaked: false,
    }
    this.enemies.push(enemy)
    this.spawnedCount += 1
    this.log('EnemySpawned', { enemyId: enemy.id, type })
    this.emit('enemy_spawned', enemy)
    this.emit('ui')
  }

  private getPmBuff(tower: RuntimeTower): { as: number; damage: number } {
    let as = 0
    let damage = 0
    for (const pm of this.towers) {
      if (pm.type !== 'pm') continue
      const range = towerStats('pm', pm.level).supportRange ?? 0
      if (Math.hypot(pm.x - tower.x, pm.y - tower.y) <= range) {
        as = Math.max(as, GAME.PM_BUFF_AS_PCT)
        if (pm.level >= 3) damage = Math.max(damage, GAME.PM_L3_DAMAGE_PCT)
      }
    }
    return { as, damage }
  }

  private getScopeCreepBuff(enemy: RuntimeEnemy): number {
    for (const other of this.enemies) {
      if (!other.alive || other.id === enemy.id) continue
      if (!ENEMIES[other.type].hasSpeedAura) continue
      if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= GAME.SCOPE_CREEP_BUFF_RADIUS) {
        return GAME.SCOPE_CREEP_BUFF_PCT
      }
    }
    return 0
  }

  private applyDamage(
    enemy: RuntimeEnemy,
    damage: number,
    source: TowerDef,
    tower: RuntimeTower,
  ): void {
    let finalDamage = damage
    if (source.bugBonusPct && enemy.type === 'bug') {
      finalDamage *= 1 + source.bugBonusPct
    }
    enemy.hp -= finalDamage

    if (source.hasSlow) {
      enemy.slowUntil = Math.max(enemy.slowUntil, this.playTimeMs + GAME.DESIGNER_SLOW_MS)
      if (tower.level >= 3) {
        for (const other of this.enemies) {
          if (!other.alive || other.id === enemy.id) continue
          if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= GAME.DESIGNER_L3_AOE) {
            other.slowUntil = Math.max(other.slowUntil, this.playTimeMs + GAME.DESIGNER_SLOW_MS)
          }
        }
      }
    }

    if (source.hasConvert && !ENEMIES[enemy.type].convertImmune && !enemy.converted) {
      if (Math.random() < GAME.SALES_CONVERT_CHANCE) {
        enemy.converted = true
        this.addFloater(enemy.x, enemy.y - 18, '🤝', '#fbbf24')
      }
    }

    if (enemy.hp <= 0) {
      this.defeatEnemy(enemy, tower)
    }
  }

  private defeatEnemy(enemy: RuntimeEnemy, killer?: RuntimeTower): void {
    if (!enemy.alive) return
    enemy.alive = false
    enemy.hp = 0
    this.enemiesDefeated += 1

    const def = ENEMIES[enemy.type]
    let reward = def.reward
    if (enemy.converted) {
      reward += Math.floor(def.reward * GAME.SALES_CONVERT_BONUS_PCT)
    }
    this.budget += reward
    this.score += GAME.SCORE_PER_KILL + (def.isBoss ? 200 : 0)
    this.addFloater(enemy.x, enemy.y - 10, `+${reward}`, '#3ecf8e')

    if (killer?.type === 'ai_agent') {
      killer.kills += 1
    }
    if (def.isBoss) this.bossDefeated = true

    this.log('EnemyDefeated', {
      enemyId: enemy.id,
      type: enemy.type,
      reward,
      converted: enemy.converted,
    })
    this.emit('enemy_defeated', enemy)
    this.emit('ui')
  }

  private leakEnemy(enemy: RuntimeEnemy): void {
    if (!enemy.alive) return
    enemy.alive = false
    enemy.leaked = true
    this.enemiesLeaked += 1
    const dmg = ENEMIES[enemy.type].runwayDamage
    const prev = this.runway
    this.runway = Math.max(0, this.runway - dmg)
    this.log('EnemyReachedCore', { enemyId: enemy.id, type: enemy.type, damage: dmg })
    this.log('RunwayChanged', { from: prev, to: this.runway, damage: dmg })
    this.addFloater(enemy.x, enemy.y - 12, `-${dmg} Runway`, '#ef4444')
    this.emit('enemy_leaked', enemy)
    this.emit('ui')

    if (this.runway <= 0) {
      this.endLoss()
    }
  }

  private endLoss(): void {
    if (this.phase === 'lost' || this.phase === 'won') return
    this.phase = 'lost'
    this.paused = false
    this.log('GameLost', { wave: this.wave })
    this.emit('game_over', 'lost')
    this.emit('ui')
  }

  private endWin(): void {
    if (this.phase === 'lost' || this.phase === 'won') return
    this.phase = 'won'
    this.paused = false
    this.score += this.runway * GAME.SCORE_PER_RUNWAY
    this.log('GameWon', { runway: this.runway, score: this.score })
    this.emit('game_over', 'won')
    this.emit('ui')
  }

  private tryClearWave(): void {
    if (this.phase !== 'combat') return
    const alive = this.enemies.some((e) => e.alive)
    const pending = this.spawnQueue.length > 0
    if (alive || pending) return

    const bonus = waveClearBonus(this.wave)
    this.budget += bonus
    this.score += GAME.SCORE_WAVE_CLEAR
    this.addFloater(GAME.WIDTH / 2, 120, `Wave Clear +${bonus}`, '#60a5fa')
    this.log('WaveCleared', { wave: this.wave, bonus })

    if (this.wave >= GAME.TOTAL_WAVES && this.bossDefeated && this.runway >= 1) {
      this.endWin()
      return
    }

    this.wave += 1
    this.phase = 'ready'
    this.enemies = this.enemies.filter((e) => e.alive)
    this.emit('wave_cleared')
    this.emit('ui')
  }

  update(dtMs: number): void {
    if (this.paused || this.phase === 'won' || this.phase === 'lost') return
    const dt = dtMs * this.speed
    this.playTimeMs += dt

    for (const f of this.floaters) f.lifeMs -= dt
    this.floaters = this.floaters.filter((f) => f.lifeMs > 0)

    if (this.phase === 'combat') {
      this.waveClock += dt
      while (this.spawnQueue.length > 0 && this.spawnQueue[0]!.at <= this.waveClock) {
        const next = this.spawnQueue.shift()!
        this.spawnEnemy(next.enemyId)
      }

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue
        if (enemy.freezeUntil > this.playTimeMs) continue

        let speedMul = 1 + this.getScopeCreepBuff(enemy)
        if (enemy.slowUntil > this.playTimeMs) {
          const resist = ENEMIES[enemy.type].slowResist ?? 0
          const slowAmt = GAME.DESIGNER_SLOW_PCT * (1 - resist)
          speedMul *= 1 - slowAmt
        }
        enemy.distance += enemy.baseSpeed * speedMul * (dt / 1000)
        const pos = positionAlongPath(enemy.distance)
        enemy.x = pos.x
        enemy.y = pos.y
        if (enemy.distance >= PATH_TOTAL_LENGTH) {
          this.leakEnemy(enemy)
        }
      }

      if (this.runway <= 0) return

      for (const tower of this.towers) {
        const def = TOWERS[tower.type]
        if (def.isSupport) continue
        tower.cooldownMs -= dt
        if (tower.cooldownMs > 0) continue

        const stats = towerStats(tower.type, tower.level)
        const buff = this.getPmBuff(tower)
        let interval = stats.attackIntervalMs / (1 + buff.as)
        if (def.hasLearn) {
          interval /= 1 + learnAttackSpeedBonus(tower.kills)
        }

        const target = pickTarget(tower.type, tower.x, tower.y, stats.range, this.enemies)
        if (!target) continue

        tower.cooldownMs = interval
        const damage = stats.damage * (1 + buff.damage)
        this.projectiles.push({
          id: nid('proj'),
          x: tower.x,
          y: tower.y,
          targetId: target.id,
          towerId: tower.id,
          damage,
          color: def.color,
          speed: 420,
          towerType: tower.type,
          towerLevel: tower.level,
          alive: true,
        })
      }

      for (const p of this.projectiles) {
        if (!p.alive) continue
        const target = this.enemies.find((e) => e.id === p.targetId && e.alive)
        if (!target) {
          p.alive = false
          continue
        }
        const dx = target.x - p.x
        const dy = target.y - p.y
        const dist = Math.hypot(dx, dy)
        const step = p.speed * (dt / 1000)
        if (dist <= step + 8) {
          p.alive = false
          const tower = this.towers.find((t) => t.id === p.towerId)
          if (tower) {
            this.applyDamage(target, p.damage, TOWERS[p.towerType], tower)
          }
        } else {
          p.x += (dx / dist) * step
          p.y += (dy / dist) * step
        }
      }
      this.projectiles = this.projectiles.filter((p) => p.alive)

      this.tryClearWave()
    }

    this.emit('tick')
  }

  buildSessionMeta(result?: SessionMeta['result']): SessionMeta {
    let mostUsedTower: TowerId | undefined
    let best = 0
    for (const [id, count] of Object.entries(this.towersPlacedByType) as Array<[TowerId, number]>) {
      if (count > best) {
        best = count
        mostUsedTower = id
      }
    }
    return {
      sessionId: this.sessionId,
      result,
      reachedWave: this.wave,
      remainingRunway: this.runway,
      playTimeMs: Math.floor(this.playTimeMs),
      finalScore: this.score,
      towersPlacedByType: { ...this.towersPlacedByType },
      enemiesDefeated: this.enemiesDefeated,
      enemiesLeaked: this.enemiesLeaked,
      mostUsedTower,
    }
  }

  persistLogs(result: 'won' | 'lost'): void {
    playLogService.persistSession(this.buildSessionMeta(result))
  }
}
