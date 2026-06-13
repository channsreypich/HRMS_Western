import { ref, computed, unref } from 'vue'

// Lightweight, reusable column sorter for list/table views.
// Pass a ref/getter/array of rows. `accessors` optionally maps a sort key
// to a function that returns the comparable value for a row.
export function useTableSort(source, { defaultKey = null, defaultDir = 'asc', accessors = {} } = {}) {
  const sortKey = ref(defaultKey)
  const sortDir = ref(defaultDir)

  const toggle = (key) => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  // Icon name for a header (caret reflects active column + direction).
  const sortIcon = (key) => {
    if (sortKey.value !== key) return 'ArrowSwapVertical'
    return sortDir.value === 'asc' ? 'ArrowUp2' : 'ArrowDown2'
  }

  const valueOf = (row, key) => {
    if (accessors[key]) return accessors[key](row)
    return row?.[key]
  }

  const sorted = computed(() => {
    const list = [...(unref(source) || [])]
    if (!sortKey.value) return list
    return list.sort((a, b) => {
      let av = valueOf(a, sortKey.value)
      let bv = valueOf(b, sortKey.value)
      av = av ?? ''
      bv = bv ?? ''
      const na = parseFloat(av)
      const nb = parseFloat(bv)
      const numeric = av !== '' && bv !== '' && !isNaN(na) && !isNaN(nb)
      let cmp
      if (numeric) cmp = na - nb
      else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  })

  return { sortKey, sortDir, toggle, sortIcon, sorted }
}
