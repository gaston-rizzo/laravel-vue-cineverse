<script setup lang="ts">

/* ============================================================================
 * COMPONENT: StarRating.vue
 * ============================================================================
 *
 * Muestra un rating de 0 a 5 estrellas. Puede usarse en modo solo lectura
 * (por ejemplo, para mostrar el promedio de una película) o en modo
 * interactivo, emitiendo el valor elegido cuando el usuario hace click
 * sobre una estrella (con preview al pasar el mouse).
 * ============================================================================ */

import { ref, computed } from "vue";

import { Star } from "lucide-vue-next";

// Props:
// - rating: valor actual (0 a 5)
// - size: tamaño en px de cada ícono de estrella
// - showValue: si se muestra el número junto a las estrellas
// - interactive: si el usuario puede seleccionar un rating haciendo click
const props = withDefaults(
  defineProps<{
    rating: number;
    size?: number;
    showValue?: boolean;
    interactive?: boolean;
  }>(),
  {
    size: 16,
    showValue: false,
    interactive: false,
  }
);

// Emite el nuevo valor de rating cuando el usuario hace click (modo interactivo)
const emit = defineEmits<{
  (e: "update:rating", value: number): void;
}>();

// Estrella sobre la que está el cursor (solo se usa en modo interactivo,
// para previsualizar el rating antes de confirmarlo con click)
const hovered = ref<number | null>(null);

// Cantidad de estrellas a pintar como "llenas":
// - en modo interactivo, prioriza el hover si existe
// - si no, usa el rating real redondeado
const filledStars = computed(() => {
  if (props.interactive && hovered.value !== null) {
    return hovered.value;
  }
  return Math.round(props.rating);
});

/**
 * Confirma la selección de rating al hacer click sobre una estrella.
 * No hace nada si el componente no es interactivo.
 * @param n - Cantidad de estrellas seleccionadas (1 a 5)
 */
function handleClick(n: number) {
  if (!props.interactive) return;
  emit("update:rating", n);
}

/**
 * Activa el preview de hover sobre una estrella determinada.
 * @param n - Estrella sobre la que entró el cursor
 */
function handleEnter(n: number) {
  if (!props.interactive) return;
  hovered.value = n;
}

/** Limpia el preview de hover al salir el cursor de las estrellas. */
function handleLeave() {
  if (!props.interactive) return;
  hovered.value = null;
}

</script>

<template>

  <div class="star-rating" :class="{ interactive }">

    <div class="stars">
      <Star
        v-for="n in 5"
        :key="n"
        :size="size"
        class="star"
        :class="{ filled: n <= filledStars }"
        @click="handleClick(n)"
        @mouseenter="handleEnter(n)"
        @mouseleave="handleLeave"
      />
    </div>
    <span v-if="showValue" class="rating-value">
      {{ rating.toFixed(1) }} / 5
    </span>

  </div>

</template>

<style scoped>

/* ============================================================================
 * STAR RATING
 * Fila de 5 estrellas que representa un rating de 0 a 5.
 *
 * Responsabilidades:
 * - Layout: alinear las estrellas y, opcionalmente, el valor numérico
 * - Estado "filled": pintar de amarillo las estrellas dentro del rating
 * - Modo interactivo: mostrar cursor pointer sobre las estrellas
 * ============================================================================ */

.star-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: rgba(255, 255, 255, 0.2);
  fill: transparent;
  transition: color 0.2s, fill 0.2s;
}

.star.filled {
  color: #facc15;
  fill: #facc15;
  filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.5));
}

.star-rating.interactive .star {
  cursor: pointer;
}

.rating-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

</style>