import Phaser from 'phaser'
import { GAME } from '@/data/constants'
import { PlayScene } from '@/game/scenes/PlayScene'
import type { GameRuntime } from '@/game/runtime/GameRuntime'
import type { UiBridge } from '@/game/scenes/PlayScene'

export function createGame(
  parent: string | HTMLElement,
  runtime: GameRuntime,
  bridge: UiBridge,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent,
    backgroundColor: '#0b1c2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
    banner: false,
  })

  game.scene.add('PlayScene', PlayScene, true, { runtime, bridge })
  return game
}
