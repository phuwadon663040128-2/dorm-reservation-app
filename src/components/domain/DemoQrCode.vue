<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: string; size?: number }>(), { size: 29 })

function hash(input: string) {
  let value = 2166136261
  for (const char of input) {
    value ^= char.charCodeAt(0)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function inFinder(row: number, column: number, originRow: number, originColumn: number) {
  const y = row - originRow
  const x = column - originColumn
  if (x < 0 || y < 0 || x > 6 || y > 6) return false
  return x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
}

const darkCells = computed(() => {
  const result: Array<{ row: number; column: number }> = []
  const seed = hash(props.value)
  for (let row = 0; row < props.size; row += 1) {
    for (let column = 0; column < props.size; column += 1) {
      const finder = inFinder(row, column, 1, 1)
        || inFinder(row, column, 1, props.size - 8)
        || inFinder(row, column, props.size - 8, 1)
      const reserved = (row <= 8 && column <= 8)
        || (row <= 8 && column >= props.size - 9)
        || (row >= props.size - 9 && column <= 8)
      const noise = (((row * 41 + column * 73 + seed) ^ (seed >>> ((row + column) % 16))) & 3) === 0
      if (finder || (!reserved && noise)) result.push({ row, column })
    }
  }
  return result
})
</script>

<template>
  <svg
    viewBox="0 0 29 29"
    role="img"
    aria-label="QR Code สำหรับการสาธิต"
    class="aspect-square size-full bg-white"
    shape-rendering="crispEdges"
  >
    <rect width="29" height="29" fill="white" />
    <rect
      v-for="cell in darkCells"
      :key="`${cell.row}-${cell.column}`"
      :x="cell.column"
      :y="cell.row"
      width="1"
      height="1"
      fill="black"
    />
  </svg>
</template>
