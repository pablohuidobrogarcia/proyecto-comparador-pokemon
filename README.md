# ⚔️ Comparador de Pokémon

Aplicación web estática para **comparar las estadísticas base de Pokémon** (PS, Ataque,
Defensa, Ataque Especial, Defensa Especial y Velocidad) mediante un gráfico de radar y una
tabla comparativa.

Pensada para desplegarse en **GitHub Pages sin backend en producción**. La app consulta
únicamente un *dataset* JSON generado previamente por un scraper offline.

---

## 📁 Estructura del proyecto

```
proyecto-comparador-pokemon/
├── scraper/                  # FASE 1: scraper offline (NO se despliega)
│   ├── index-pokemon.js      # Obtiene la lista de Pokémon desde Wikidex
│   ├── scrape.js             # Extrae stats/tipos/imagen de cada Pokémon
│   └── package.json
├── frontend/                 # FASE 2: app estática (React + Vite)
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── SearchBox.jsx
│       │   ├── PokemonCard.jsx
│       │   ├── RadarChart.jsx
│       │   └── ComparisonTable.jsx
│       └── data/
│           └── pokemon-dataset.json   # generado por el scraper
├── .github/workflows/
│   ├── scrape.yml            # regenera el dataset (mensual + manual)
│   └── deploy.yml            # build + publica en gh-pages
└── README.md
```

---

## 🛠️ FASE 1 — Ejecutar el scraper localmente

El scraper genera `frontend/src/data/pokemon-dataset.json` consultando **wikidex.net**.
Necesitas Node.js 18+.

```bash
cd scraper
npm install
npm run scrape          # genera el dataset completo
```

Opciones:

- `npm run index` genera solo la lista de Pokémon (`scraper/pokemon-index.json`).
- `npm run build:data` regenera índice + dataset.
- Variable de entorno `SCRAPE_DELAY` (ms) para ajustar la espera entre peticiones
  (por defecto 500 ms, para no saturar Wikidex):

  ```bash
  SCRAPE_DELAY=400 npm run scrape
  ```

El progreso se guarda cada 50 páginas, por lo que si se interrumpe puedes retomarlo sin
perder todo. Los Pokémon que fallen se listan al final y en `scraper/scrape-errors.json`.

### 🎯 Modelo de datos: una entrada por tabla de stats

Las fichas de Wikidex contienen, dentro de la sección **"Características de combate"**
(`<h2>`), una o varias tablas de estadísticas base (a menudo agrupadas en subsecciones
`<h3>` por forma o generación: forma base, megaevoluciones, Gigamax, formas regionales,
Pokémon iniciales con stats distintas, etc.). **El scraper genera una entrada independiente
en el dataset por cada tabla de stats**, sin filtrar ni deduplicar:

1. Localiza la sección `Características de combate`.
2. Recorre en orden de documento todas las tablas `table.tabpokemon.caracteristicas`.
 3. El nombre de cada entrada es el encabezado (`<h3>`) más cercano por encima de la tabla;
   si la tabla cuelga directamente del `<h2>` (sin `<h3>`), usa el título de la página.
4. `id` es un identificador interno único por entrada (slug de la forma + sufijo incremental
   si hay colisión), usado como clave en React; no es el número de Pokédex nacional.
5. `sprite` es el sprite concreto de la subsección si existe, o el sprite principal de la
   página en caso contrario.
6. `types` se toma de la **infobox principal** superior de la página (la misma para todas
   las entradas de esa página). Por tanto, para formas alternativas (megasevoluciones,
   formas regionales) el tipo puede no coincidir con el real de esa forma; queda como
   mejora futura corregirlo por entrada.
7. El campo opcional `pokemonBase` guarda el nombre de la forma base de la página
   (sin prefijos/sufijos de forma alternativa), útil para agrupar variantes en el frontend.

> 📌 Resultado: páginas con varias formas producen varias entradas que pueden compartir el
> **mismo nombre** (p. ej. Charizard, Mega-Charizard X y Mega-Charizard Y; o Pikachu en
> varias generaciones). El frontend deberá permitir elegir entre entradas homónimas.

**Tipo(s):** se extraen de la infobox principal de la página como array de 1 o 2 elementos
(ej. `["Fuego","Volador"]`).

> ⚠️ **Aviso:** el scraper depende de la estructura HTML actual de
> [wikidex.net](https://www.wikidex.net). Si la wiki cambia su maquetación, habrá que
> actualizar los selectores en `scrape.js`.

---

### ✏️ Edición manual del dataset vía CSV (Excel / Google Sheets)

Además del scraper, puedes corregir stats, tipos o nombres a mano editando el
dataset en una hoja de cálculo y volviéndolo a importar:

```bash
cd scraper
npm run export-csv    # genera scraper/pokemon-dataset.csv (UTF-8 con BOM)
```

1. Abre `scraper/pokemon-dataset.csv` en **Excel** o **Google Sheets**.
   - El archivo lleva **BOM UTF-8**, así que las tildes y "ó"/"é" se ven bien en
     Windows. En Excel, al guardar, elige **Guardar como → CSV (delimitado por
     comas)** y asegúrate de que la codificación sea **UTF-8**.
   - En **Google Sheets**: `Archivo → Descargar → Valores separados por comas (.csv)`
     ya exporta en UTF-8.
2. Edita las columnas que necesites (`ps`, `ataque`, `tipo1`, `tipo2`, etc.).
   Cada fila es una entrada; las formas alternativas (megasevoluciones, formas
   regionales) aparecen como filas independientes con su propio `id` único.
3. No borres ni renombres la columna `id` (el frontend la usa como clave). La columna
   `slug` es informativa y puede dejarse tal cual. Deja `tipo2` vacío si el Pokémon
   tiene un solo tipo.
4. Vuelve a generar el JSON del frontend:

```bash
npm run import-csv     # lee el CSV y sobrescribe frontend/src/data/pokemon-dataset.json
```

El import **valida** que los campos numéricos sean números válidos y no estén
vacíos; si alguna fila es incorrecta, se detiene y avisa con el `name` de la fila
problemática (no genera un JSON corrupto).

> ⚠️ Tras importar, haz **commit + push** para que el cambio llegue a GitHub Pages:
> `git add frontend/src/data/pokemon-dataset.json && git commit -m "Ajustes manuales en dataset" && git push`.
> El despliegue se reejecuta solo con el `push` a `main`.

---

## 💻 FASE 2 — Ejecutar la app en local

```bash
cd frontend
npm install
npm run dev             # servidor de desarrollo (Vite)
```

Abre la URL que indique Vite (normalmente http://localhost:5173).

Para generar la versión de producción:

```bash
npm run build           # genera frontend/dist
npm run preview         # previsualiza el build
```

---

## 🚀 Despliegue automático en GitHub Pages

El repositorio incluye dos *GitHub Actions*:

1. **`deploy.yml`** — en cada `push` a `main`:
   - Instala dependencias del `frontend`.
   - Ejecuta `npm run build`.
   - Publica `frontend/dist` en la rama **`gh-pages`** usando
     [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages).

2. **`scrape.yml`** — programado (el día 1 de cada mes, `cron`) y ejecutable manualmente
   (`workflow_dispatch`): vuelve a ejecutar el scraper y hace *commit* del JSON actualizado.

### Pasos para publicar

1. Crea el repositorio en GitHub y sube el código (`git push`).
2. En **Settings → Pages** elige *Source: Deploy from a branch* → rama **`gh-pages`**,
   carpeta `/ (root)`.
3. En **Settings → Actions → General → Workflow permissions**, asegúrate de que sea
   **"Read and write permissions"** (necesario para que el deploy y el scrape hagan push).
4. Cada `push` a `main` desplegará automáticamente la app.

> 🔧 **Importante:** GitHub Pages sirve el sitio desde `https://<usuario>.github.io/<repo>/`.
> Por eso `frontend/vite.config.js` usa `base: '/<repo>/'`. Cambia `repoName` dentro de ese
> archivo por el nombre exacto de tu repositorio. Si despliegas en la raíz de un dominio
> propio, usa `base: '/'`.

---

## 📊 Cómo funciona la comparación

- Buscador con autocompletado (Fuse.js) sobre el dataset ya cargado en memoria.
- Hasta **4** Pokémon seleccionables.
- Cada ficha muestra sprite y tipos (con color).
- **Gráfico de radar** (Recharts) superpone las 6 stats base con leyenda y colores distintos.
- **Tabla comparativa**: una fila por stat, una columna por Pokémon; el valor más alto de
  cada fila se resalta en negrita y con el color del Pokémon.
- Se muestra el **total** de stats base por Pokémon.

---

## 📝 Datos

Los datos se obtienen de [Wikidex](https://www.wikidex.net) únicamente durante la fase
offline del scraper. La app en producción **no realiza ninguna petición de red** a Wikidex
ni a ningún servidor propio: todo viene del JSON embebido en el build.
