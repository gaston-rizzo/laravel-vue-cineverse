/* ============================================================================
 * API: webApi.ts
 * ============================================================================
 *
 * Axios para rutas web de Laravel/Breeze.
 *
 * Se usa para rutas web de Laravel y para endpoints /api del mismo proyecto.
 * ============================================================================
 */

import axios from "axios";

const webApi = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

export default webApi;
