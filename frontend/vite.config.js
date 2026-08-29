import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANTE PARA GITHUB PAGES:
// Cambia 'proyecto-comparador-pokemon' por el nombre exacto de tu repositorio en GitHub.
// Si despliegas en un dominio propio o en la raíz, usa base: '/'.
const repoName = 'proyecto-comparador-pokemon';

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
});
