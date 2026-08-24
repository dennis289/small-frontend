/**
 * Drag-to-reorder for a plain array, on native HTML5 drag events.
 *
 * Deliberately dependency-free: the project has no drag library, and the whole
 * behaviour is small enough that pulling one in would cost more than it saves.
 *
 * Usage — bind the handlers to each row and let the callback do the mutation:
 *
 *   const drag = useDragOrder((from, to) => move(items, from, to))
 *   <div draggable="true" v-bind="drag.rowProps(index)">
 *
 * `rowProps` also returns the drag state as classes so rows can style themselves
 * while being dragged over; see `.drag-row` in the consuming page's styles.
 */
import { ref } from 'vue'

/** Move one element of `list` from `from` to `to`, in place. */
export function moveItem (list, from, to) {
  if (from === to || from == null || to == null) {
    return list
  }
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
  return list
}

export function useDragOrder (onReorder) {
  // Index of the row being dragged, and the row it is currently hovering over.
  // Both null when no drag is in flight.
  const draggingIndex = ref(null)
  const overIndex = ref(null)
  // Set while a drag is disabled mid-gesture, so a filtered list can refuse
  // reordering without the row appearing frozen.
  const enabled = ref(true)

  function reset () {
    draggingIndex.value = null
    overIndex.value = null
  }

  function onDragStart (index, event) {
    if (!enabled.value) {
      return
    }
    draggingIndex.value = index
    // Firefox only starts a drag once data is set, and `move` gives the right cursor.
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function onDragOver (index, event) {
    if (!enabled.value || draggingIndex.value === null) {
      return
    }
    // Without preventDefault the drop event never fires.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    overIndex.value = index
  }

  function onDrop (index, event) {
    if (!enabled.value || draggingIndex.value === null) {
      return
    }
    event.preventDefault()
    const from = draggingIndex.value
    reset()
    if (from !== index) {
      onReorder(from, index)
    }
  }

  /** Everything a row needs, so the template stays a single v-bind. */
  function rowProps (index) {
    return {
      draggable: enabled.value,
      onDragstart: event => onDragStart(index, event),
      onDragover: event => onDragOver(index, event),
      onDrop: event => onDrop(index, event),
      onDragend: reset,
      class: {
        'drag-row': true,
        'drag-row--dragging': draggingIndex.value === index,
        'drag-row--over': overIndex.value === index && draggingIndex.value !== index,
      },
    }
  }

  return { draggingIndex, overIndex, enabled, rowProps, reset }
}
