/* ============================================================================
 * COMPOSABLE: useMoviesFilters.ts
 * ============================================================================
 *
 * Maneja el estado reactivo de los filtros de búsqueda de películas:
 * texto (con debounce), géneros, años, rating y orden. También sincroniza
 * TODOS los filtros con los query params de la URL (no solo el texto),
 * para que sobrevivan a la navegación, al F5 y sean compartibles/bookmarkeables.
 * Si la URL llega vacía (ej: al entrar por el link "Movies" del menú de
 * navegación, que a propósito no lleva filtros), se restaura el último
 * query guardado en sessionStorage, para no perder los filtros al salir
 * y volver a Movies.
 *
 * Nota: este composable no hace fetch de datos, solo mantiene el estado.
 * Otro composable (useMoviesQuery) consume estos filtros para ejecutar
 * la query real con Vue Query.
 * ============================================================================ */

import { reactive, computed, watch, toRefs, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { MovieListType } from "@/features/movies/types/movie-list-type";

// Clave de sessionStorage donde se guarda el último query de filtros
const FILTERS_STORAGE_KEY = "moviesFilters:lastQuery";

/** Lee el último query guardado en sessionStorage (aislado por pestaña:
 *  si el usuario abre otra pestaña del sitio, no lo comparte). Si no hay
 *  nada guardado o falla (modo privado, storage lleno, etc.), devuelve un
 *  objeto vacío.
 *  Ej: si se guardó {search: "batman", list: "discover"}, lo devuelve tal cual. */
function readStoredQuery(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Guarda el último query escrito en la URL, para poder restaurarlo si
 *  se navega a Movies con una URL limpia (ej: click en el nav-link). */
function writeStoredQuery(query: Record<string, string>) {
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(query));
  } catch {
    // no crítico, simplemente no persiste
  }
}

/**
 * Helpers de parseo para leer los filtros desde los query params de la URL.
 * Son tolerantes a valores ausentes o inválidos: si algo no matchea,
 * devuelven el default correspondiente en vez de romper.
 * Ej: parseIntParam("2005") → 2005, parseIntParam("abc") → null
 */
function parseIntParam(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function parseGenresParam(value: unknown): number[] {
  if (typeof value !== "string" || !value) return [];
  return value
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((n) => !Number.isNaN(n));
}

function parseListType(value: unknown): MovieListType {
  const valid: MovieListType[] = [
    "discover", "popular", "now_playing", "upcoming", "top_rated",
  ];
  return valid.includes(value as MovieListType)
    ? (value as MovieListType)
    : "popular";
}

/**
 * Compara dos arrays por contenido (no por referencia).
 *
 * Es clave para evitar reasignar filters.selectedGenres / filters.ratingRange
 * con un array "nuevo" pero con el mismo contenido: si se reasigna igual,
 * Vue detecta un cambio de referencia, dispara los watchers que dependen de
 * esos refs (queryKey, resetSignal en MoviesView, etc.) y termina reseteando
 * la grilla de resultados aunque nada haya cambiado realmente.
 * 
 * Ej: arraysEqual([28, 12], [28, 12]) → true (mismo contenido, distinta
 * referencia). arraysEqual([28, 12], [12, 28]) → false (mismo contenido,
 * distinto orden).
 */
function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Composable principal: arma el estado reactivo de filtros y lo mantiene
 * sincronizado con la URL en ambas direcciones (URL → estado y estado → URL).
 * Se usa una vez en MoviesView y se pasa como prop a MovieFilters.
 *
 * Ej: const filters = useMoviesFilters();
 *     filters.txtMovie.value = "batman"; // dispara debounce y actualiza la URL
 */
export function useMoviesFilters() {

  const route = useRoute();
  const router = useRouter();

  // Evita que la escritura a la URL dispare el watcher de lectura
  // (route.query) y se pisen entre sí en un loop.
  //
  // IMPORTANTE: el watcher de escritura (más abajo) corre en un flush
  // posterior de Vue, no en el mismo tick sincrónico en el que se setea
  // este flag. Por eso, cuando se vuelve a poner en false, se espera un
  // nextTick() para asegurarse de que ese flush ya haya pasado y el guard
  // realmente lo frene (ver watcher de lectura).
  let syncingFromRoute = false;

  // Si la URL no trae ningún query param (típicamente: se entró por el
  // nav-link, que a propósito no lleva filtros), se restaura el último
  // query guardado en esta pestaña. Si la URL SÍ trae params, esos mandan
  // siempre y no se toca el storage.
  const hasUrlParams = Object.keys(route.query).length > 0;
  const initialQuery: Record<string, unknown> = hasUrlParams
    ? route.query
    : readStoredQuery();

  // Estado reactivo agrupado (evita múltiples ref() separados
  // y permite acceder sin .value en los templates)
  const filters = reactive({

    // Tipo de listado. Se inicializa desde la URL (?list=) si viene,
    // sino cae en "popular" por default
    listType: parseListType(initialQuery.list),

    // Texto que escribe el usuario en la búsqueda
    txtMovie: typeof initialQuery.search === "string" ? initialQuery.search : "",

    // Texto con debounce usado para ejecutar la query a la API.
    // Se inicializa igual que txtMovie porque, si viene de la URL,
    // ya es un valor "confirmado" (no hace falta esperar el debounce)
    debouncedQuery: typeof initialQuery.search === "string" ? initialQuery.search : "",

    // IDs de géneros seleccionados, parseados desde ?genres=28,12
    selectedGenres: parseGenresParam(initialQuery.genres),

    // Rango de años de estreno, parseado desde ?yearFrom= / ?yearTo=.
    // null significa "sin filtro" (no hay que confundirlo con un default
    // hardcodeado tipo 1900 — eso se decide en la UI, no acá)
    yearFrom: parseIntParam(initialQuery.yearFrom),

    yearTo: parseIntParam(initialQuery.yearTo),

    // Rango de rating del slider [min, max], parseado desde
    // ?ratingMin= / ?ratingMax=, con 0 y 10 como defaults
    ratingRange: [
      parseIntParam(initialQuery.ratingMin) ?? 0,
      parseIntParam(initialQuery.ratingMax) ?? 10,
    ] as [number, number],

    // Orden seleccionado para la API de TMDB, parseado desde ?sort=
    sortBy: typeof initialQuery.sort === "string" ? initialQuery.sort : "vote_average.desc",
  });

  // Si el estado inicial vino del sessionStorage (URL vacía al entrar,
  // por ejemplo por el nav-link), se empuja a la URL para que quede
  // reflejado y sea bookmarkeable/compartible. Si la URL ya traía algo,
  // initialQuery === route.query y esto no hace nada distinto.
  if (!hasUrlParams && Object.keys(initialQuery).length > 0) {
    syncingFromRoute = true;
    router.replace({ query: initialQuery as Record<string, string> })
      .finally(() => nextTick(() => { syncingFromRoute = false; }));
  }

/**
   * Sincroniza todos los filtros con los query params de la URL: escucha
   * route.query y actualiza "filters" en base a lo que diga la URL.
   *
   * Se dispara con cualquier navegación que cambie la URL: botón atrás/
   * adelante del navegador, volver desde el detalle de una película, o
   * editar la URL a mano. No escribe la URL, solo la lee (para eso está
   * el otro watcher, el "de escritura", más abajo).
   *
   * No se usa { immediate: true } a propósito: por default, un watch en
   * Vue NO ejecuta su callback al crearse, solo cuando la fuente cambia
   * después. Acá conviene que sea así, porque el estado inicial de
   * "filters" ya se calculó una vez al declarar el reactive() más arriba,
   * leyendo route.query en ese momento. Si se agregara { immediate: true },
   * este watcher repetiría ese mismo cálculo apenas se monta el
   * composable, haciendo el mismo trabajo dos veces sin necesidad.
   *
   * selectedGenres (géneros elegidos) y ratingRange ([min, max] del
   * slider) son arrays. Dos arrays con el mismo contenido son objetos
   * distintos para Vue, así que reasignarlos siempre crea una referencia
   * "nueva" aunque no haya cambiado nada. Eso dispara en cascada el reset
   * de la grilla de resultados sin motivo. Por eso solo se reasignan si
   * arraysEqual dice que el contenido realmente cambió.
   */
  watch(
    () => route.query,
    async (query) => {

      // Activa el guard para que el watcher de escritura (más abajo)
      // no interprete esta sincronización como un cambio hecho por el
      // usuario y reescriba la URL innecesariamente
      syncingFromRoute = true;

      // listType es un string simple: reasignar siempre es inofensivo,
      // no dispara falsos positivos de cambio de referencia
      filters.listType = parseListType(query.list);

      // Solo reasigna si el contenido cambió. Si se reasignara siempre,
      // cada corrida de este watcher crearía un array nuevo (misma data,
      // distinta referencia) y eso dispararía en cascada: queryKey →
      // resetSignal en MoviesView → reset de la grilla, aunque el filtro
      // de géneros no haya cambiado realmente
      const newGenres = parseGenresParam(query.genres);

      // Evita reasignar si el contenido es igual: sino se crea una
      // referencia nueva en cada corrida del watcher y eso dispara
      // en cascada el reset de la grilla aunque nada haya cambiado
      if (!arraysEqual(filters.selectedGenres, newGenres)) {
        filters.selectedGenres = newGenres;
      }

      // yearFrom/yearTo son number | null: la comparación por valor ya
      // la hace Vue internamente, no hace falta un chequeo manual acá
      filters.yearFrom = parseIntParam(query.yearFrom);
      filters.yearTo = parseIntParam(query.yearTo);

      // Mismo caso que selectedGenres: ratingRange es un array/tupla,
      // así que se compara contenido antes de reasignar para no romper
      // la referencia sin necesidad
      const newRating: [number, number] = [
        parseIntParam(query.ratingMin) ?? 0,
        parseIntParam(query.ratingMax) ?? 10,
      ];

      // Mismo caso que selectedGenres: solo reasigna si el contenido
      // cambió, para no generar una referencia nueva sin necesidad
      if (!arraysEqual(filters.ratingRange, newRating)) {
        filters.ratingRange = newRating;
      }

      // sortBy ya no es string | null: el default es "vote_average.desc"
      // (mismo valor que resetAdvancedFilters usa al resetear), para que
      // discover sin filtros y discover recién reseteado queden en el
      // mismo estado. Se compara por valor automáticamente, así que
      // reasignar siempre es seguro
      filters.sortBy = typeof query.sort === "string" ? query.sort : "vote_average.desc";

      // Recalcula el texto de búsqueda directo desde la URL. Se trimea acá
      // porque puede venir de una edición manual de la URL con espacios
      const search = typeof query.search === "string" ? query.search.trim() : "";
      filters.txtMovie = search;

      // Se asigna directo, sin pasar por el debounce: si el texto viene
      // de la URL ya es un valor "confirmado", no un tipeo en curso, así
      // que no tiene sentido esperar los 500ms del watcher de txtMovie
      filters.debouncedQuery = search.length >= 3 ? search : "";

      // Espera a que Vue procese el flush de reactividad de este tick
      // (incluido el watcher de escritura, si llegó a dispararse por
      // alguna de las asignaciones de arriba) antes de bajar el flag.
      // Sin este await, syncingFromRoute ya volvería a false para cuando
      // el watcher de escritura efectivamente corre, y el guard de abajo
      // nunca lo frenaría.
      await nextTick();

      syncingFromRoute = false;
    }
  );

  // Timeout del debounce de escritura a la URL
  let writeTimeout: number | undefined;

 /**
  * Escribe el estado de los filtros en la URL como query params, cada
  * vez que cambian (con 300ms de debounce, ver writeTimeout más abajo).
  *
  * Usa router.replace en vez de router.push. Ambos cambian la URL, pero
  * push agrega una entrada nueva al historial del navegador (así que
  * "atrás" vuelve a la URL anterior), mientras que replace pisa la
  * entrada actual sin agregar una nueva.
  *
  * Acá conviene replace: si se usara push, cada pequeño ajuste de un
  * filtro agregaría una entrada al historial, y el usuario tendría que
  * apretar "atrás" muchas veces seguidas para volver a la página anterior
  * a Movies, en vez de una sola.
  *
  * Ej: el usuario mueve el slider de años de 2000 a 2001 a 2002 mientras
  * arrastra. Con push, cada uno de esos valores intermedios quedaría en
  * el historial (3 entradas nuevas). Con replace, solo queda la última
  * URL (?yearFrom=2002), sin entradas de por medio.
  */
  watch(
    () => [
      filters.listType,
      filters.selectedGenres.slice(),
      filters.yearFrom,
      filters.yearTo,
      filters.ratingRange.slice(),
      filters.sortBy,
      filters.debouncedQuery,
    ],
    () => {

      // Si este cambio vino de sincronizar desde la URL (el watcher de
      // lectura de más arriba), no hay que volver a escribirla: ya está
      // actualizada y evita el loop lectura → escritura → lectura → ...
      if (syncingFromRoute) return;

      // Cancela cualquier escritura pendiente anterior, para que solo
      // se ejecute la última (debounce): si el usuario mueve el slider
      // varias veces seguidas, no se escribe la URL en cada movimiento,
      // solo 300ms después del último
      if (writeTimeout) clearTimeout(writeTimeout);

      writeTimeout = window.setTimeout(() => {
        const query: Record<string, string> = {};

        // Solo se agrega cada param si difiere de su valor por defecto,
        // para mantener la URL limpia. Los defaults son: listType="popular",
        // selectedGenres=[], yearFrom/yearTo=null, ratingRange=[0,10],
        // sortBy=null, debouncedQuery="".
        // Ej: listType="popular" (es el default) → no se agrega "list"
        //     listType="discover" (no es el default) → se agrega list="discover"
        //     ratingRange=[0,10] (es el default completo) → no se agrega nada
        //     ratingRange=[5,10] (el mínimo cambió) → se agrega ratingMin="5"
        if (filters.listType !== "popular") query.list = filters.listType;
        if (filters.selectedGenres.length) query.genres = filters.selectedGenres.join(",");
        if (filters.yearFrom !== null) query.yearFrom = String(filters.yearFrom);
        if (filters.yearTo !== null) query.yearTo = String(filters.yearTo);
        if (filters.ratingRange[0] > 0) query.ratingMin = String(filters.ratingRange[0]);
        if (filters.ratingRange[1] < 10) query.ratingMax = String(filters.ratingRange[1]);        
        if (filters.sortBy !== "vote_average.desc") query.sort = filters.sortBy;
        if (filters.debouncedQuery) query.search = filters.debouncedQuery;

        // Guarda el query recién escrito en sessionStorage, para poder
        // restaurarlo si se vuelve a esta vista con una URL limpia (sin
        // query params). Esto pasa, por ejemplo, al hacer click en el
        // link "Movies" del menú de navegación (AppHeader.vue), que a
        // propósito no lleva ningún filtro en su URL.
        writeStoredQuery(query);

        // Aplica el query armado a la URL real. router.replace (no push)
        // reemplaza la entrada actual del historial en vez de crear una
        // nueva, para no acumular una entrada por cada micro-ajuste de
        // filtro (ver comentario del watch más arriba)
        router.replace({ query });

      }, 300);
    },
    { deep: true }
  );

  // Timeout del debounce, fuera del watch para poder cancelarlo
  let timeout: number | undefined;

  /**
   * Aplica debounce (500ms) al input de búsqueda del usuario.
   * Solo actualiza "debouncedQuery" si el valor no vino ya sincronizado
   * desde el router, y solo dispara búsqueda con 3+ caracteres.
   */
  watch(
    () => filters.txtMovie,
    (value) => {

      // Si viene del router, no debouncear
      if (value === filters.debouncedQuery) return;

      if (timeout) {
        clearTimeout(timeout);
      }

      // window.setTimeout evita problemas de tipos en TS
      timeout = window.setTimeout(() => {

        const clean = value.trim();

        // Solo reasigna si el valor final realmente difiere del actual:
        // evita un cambio de referencia/valor innecesario que dispararía
        // de nuevo el watcher de queryKey (y el reset de la grilla) aunque
        // el texto "limpio" termine siendo igual al que ya estaba.
        //
        // Ej: value="batman " (con espacio final, tras trim → "batman")
        //     y debouncedQuery ya es "batman" → clean === debouncedQuery,
        //     no reasigna nada, no dispara la query de nuevo.
        //
        // Ej: value="ba" (2 caracteres) → clean.length < 3 → si
        //     debouncedQuery ya era "" (porque el usuario venía de borrar
        //     texto), clean !== debouncedQuery es false, no reasigna.
        //     Si debouncedQuery tenía algo previo (ej "bat"), sí reasigna
        //     a "" para cortar la búsqueda por texto.
        if (clean !== filters.debouncedQuery) {
          if (clean.length >= 3) {
            // Ej: value="batman" → clean="batman" (>=3) → dispara
            // búsqueda por texto con "batman"
            filters.debouncedQuery = clean;      
          } else {
            // Ej: value="b" o value="" → clean.length < 3 → limpia
            // debouncedQuery para que useMoviesQuery caiga en el caso
            // de listType/discover en vez de buscar por texto
            filters.debouncedQuery = "";
          }
        }

      }, 500);
    },
  );

  /**
   * Agrega o quita un género de la lista de seleccionados (toggle).
   * @param id - Id del género
   */
  const toggleGenre = (id: number) => {

    const index = filters.selectedGenres.indexOf(id);

    if (index !== -1) {
      filters.selectedGenres.splice(index, 1);
    } else {
      filters.selectedGenres.push(id);
    }
  };

  // Texto de búsqueda válido (mínimo 3 caracteres)
  const hasText = computed(() => filters.debouncedQuery.trim().length >= 3);

  // Indica si hay algún filtro activo en modo "discover"
  const hasFilters = computed(
    () =>
      filters.listType === "discover" &&
      (filters.selectedGenres.length > 0 ||
        filters.yearFrom !== null ||
        filters.yearTo !== null ||        
        filters.sortBy !== "vote_average.desc" ||
        filters.ratingRange[0] > 0 ||
        filters.ratingRange[1] < 10),
  );

  // Valores derivados del slider de rating
  const minRating = computed(() => filters.ratingRange[0]);
  const maxRating = computed(() => filters.ratingRange[1]);

  const sortedGenres = computed(() =>
    [...filters.selectedGenres].sort((a, b) => a - b),
  );

  /**
   * Clave única para Vue Query. Incluye todo lo que afecte los resultados
   * (texto, géneros, años, rating, orden) para cachear/refetchear correctamente.
   * Ejemplo: ['movies', 'batman', [28], 'es']
   */
  const queryKey = computed(() => [
    "movies",
    filters.listType,
    filters.debouncedQuery || null,
    sortedGenres.value,
    filters.yearFrom,
    filters.yearTo,
    minRating.value,
    maxRating.value,
    filters.sortBy,
  ]);

  return {
    // toRefs mantiene la reactividad de cada propiedad al desestructurar
    ...toRefs(filters),
    toggleGenre,
    hasText,
    hasFilters,
    queryKey,
    minRating,
    maxRating,
  };
}

// ReturnType infiere automáticamente los tipos (txtMovie: Ref<string>, hasFilters: ComputedRef<boolean>, etc.)
export type MovieFilters = ReturnType<typeof useMoviesFilters>;