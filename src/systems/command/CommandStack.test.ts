import { describe, expect, it } from 'vitest'
import { CommandStack } from '@/systems/command/CommandStack'

describe('CommandStack', () => {
  it('undoes and redoes commands', () => {
    let value = 0
    const stack = new CommandStack(50)
    stack.execute({
      id: '1',
      label: 'inc',
      execute: () => {
        value += 1
      },
      undo: () => {
        value -= 1
      },
    })
    expect(value).toBe(1)
    expect(stack.undo()).toBe(true)
    expect(value).toBe(0)
    expect(stack.redo()).toBe(true)
    expect(value).toBe(1)
  })

  it('respects max history size', () => {
    const stack = new CommandStack(3)
    for (let i = 0; i < 5; i += 1) {
      stack.execute({
        id: String(i),
        label: 'n',
        execute: () => undefined,
        undo: () => undefined,
      })
    }
    expect(stack.size).toBe(3)
  })
})
