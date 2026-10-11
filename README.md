# 🚀 JEV CV Evaluator Enterprise — Fase 1

Sistema empresarial de evaluación determinista de currículums técnicos impulsado por **TypeSafe AI (JEV - System One Discriminative Model)**, **Next.js 14 (App Router)**, **PostgreSQL 16**, **Prisma ORM** y **Tailwind CSS**.

Permite a los equipos de reclutamiento gestionar múltiples convocatorias técnicas en paralelo, procesar cientos de currículums en PDF (en inglés), aplicar rúbricas ordinales configurables (0–4.0 pts), registrar notas internas y controlar el funnel de selección de candidatos con un costo de inferencia real de solo **$0.042 / 1M tokens**.

---

## 🌟 Características Principales (Fase 1 Completada)

1. **Evaluación Determinista con TypeSafe AI (`jev-1.13.0`):**
   - Sin simulaciones ni textos alucinados: juicios numéricos puros en escala ordinal (0 a 4), distribución de probabilidades por clase, nivel de confianza estadística y comprobaciones binarias (Seniority, Hands-on, Producción).
   - Tarificación oficial verificada: **$0.042 por millón de tokens de entrada** (tokens de salida gratuitos). Un CV típico (~2,000 tokens) cuesta aproximadamente **$0.000084 USD**.

2. **Gestión de Procesos y Convocatorias de Selección:**
   - Creación de vacantes con pesos personalizados por dimensión: **Skills Técnicas**, **Experiencia en Producción**, **Educación/Fundamentos**, y **Liderazgo/Propiedad**.
   - Umbral de corte configurable (por defecto 2.5 / 4.0).
   - Control de ciclo de vida del proceso: **Activo** (admite CVs y evaluaciones), **Pausado** (en espera temporal), y **Cerrado / Inactivo** (solo lectura protegido).
   - Filtros de estado en tiempo real en la cabina de control principal.

3. **Ingesta Multi-PDF & Filtro de Calidad:**
   - Carga simultánea de múltiples currículums en PDF mediante selector de archivos o *drag & drop* (optimizado para Safari y Chrome).
   - Extracción de texto moderna en el servidor con `unpdf` (sin errores de streams binarios en PDFs modernos).
   - Deduplicación por hash SHA-256: si un archivo ya fue cargado, se reutiliza y nunca se cobra dos veces.
   - **Política de Idioma en Inglés:** Detección lingüística previa con `franc` y validación de stopwords; los CVs en otros idiomas se etiquetan como `WRONG_LANGUAGE` sin consumir cuota de tokens en la API de JEV.

4. **Revisión Humana y Funnel de Candidatos (*Human in the Loop*):**
   - **Selector de Etapa:** Permite avanzar a cada candidato a través del embudo de contratación (`📋 Postulado` → `🔍 En Revisión` → `🎙️ Entrevista` → `💼 Oferta` → `🎉 Contratado` → `🚫 Descartado`).
   - **Filtros por Etapa:** Pestañas superiores para filtrar la tabla clasificatoria al instante.
   - **Notas del Reclutador:** Modal dedicado para registrar observaciones cualitativas, feedback de entrevistas y pretensión salarial con indicador visual en la tabla.
   - **Visor Integrado de CV y Evaluación:** Consulta el documento original extraído junto con el reporte ordinal de JEV.

5. **Auditoría y Exportación:**
   - Registro en base de datos (`AuditLog`) de cada cambio de estado, subida o evaluación.
   - Exportación de la tabla clasificatoria a **CSV** con scores detallados, etapas y notas del reclutador.

---

## 🏛️ Arquitectura del Proyecto

```
cv-evaluator/
├── docker-compose.yml             # Contenedor PostgreSQL 16 con volumen persistente
├── prisma/
│   ├── schema.prisma              # Modelos: Vacancy, Candidate, Application, CvDocument, Evaluation, AuditLog
│   └── seed.ts                    # Vacantes y usuario administrador inicial
├── sample_cvs/                    # 5 CVs de prueba en PDF (en inglés y español)
├── storage/
│   └── cvs/                       # Almacenamiento local de PDFs deduplicados por SHA-256
└── src/
    ├── app/
    │   ├── page.tsx               # Cockpit ejecutivo con KPIs y listado de vacantes
    │   ├── vacantes/
    │   │   ├── nueva/             # Formulario de creación de vacantes con pesos
    │   │   └── [id]/              # Sala de control del proceso, Leaderboard y carga de PDFs
    │   └── api/
    │       ├── vacancies/         # Endpoints REST para vacantes, subida, evaluación y CSV
    │       ├── applications/      # Endpoints PATCH para etapa y notas del reclutador
    │       └── auth/              # Configuración NextAuth (listo para Fase 2)
    ├── components/
    │   ├── CVDocumentViewer.tsx   # Modal visor de CV y evaluación JEV
    │   ├── EvaluationCriteriaModal.tsx # Guía interactiva de rúbricas ordinales
    │   ├── Navigation.tsx         # Barra de navegación principal
    │   └── VacanciesListWithFilter.tsx # Grid de vacantes con pestañas y selector de estado
    └── lib/
        ├── languageDetector.ts    # Detección local de idioma (English-only gate)
        ├── pricing.ts             # Motor de cálculo financiero JEV ($0.042 / 1M)
        ├── prisma.ts              # Cliente Singleton de Prisma
        ├── storage.ts             # Almacenamiento de archivos y extracción con unpdf
        └── typesafe.ts            # Cliente oficial del SDK de TypeSafe AI (JEV)
```

---

## 💰 Modelo Financiero Oficial (TypeSafe AI)

A diferencia de modelos generativos estándar inflados, JEV es un modelo discriminativo de Sistema Uno:

| Concepto | Tarifa Oficial |
| :--- | :--- |
| **Tokens de Entrada** | **$0.042 por millón de tokens** ($0.000000042 / token) |
| **Tokens de Salida** | **$0.00 (Gratis)** |
| **Costo promedio por CV** | **~$0.00008 USD** (~$0.08 USD por cada 1,000 CVs) |

$$\text{Costo USD} = \frac{\text{Tokens de Entrada} \times 0.042}{1,000,000}$$

---

## 🚀 Puesta en Marcha (Desarrollo Local)

### 1. Requisitos Previos
- **Node.js** v18+ (recomendado v20+)
- **Docker & Docker Compose** (para PostgreSQL)
- **API Key de TypeSafe AI**

### 2. Configurar Variables de Entorno
Crea o verifica tu archivo `.env.local` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cv_evaluator?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-clave-secreta-para-sesiones-jwt"
TYPESAFE_API_KEY="tu_api_key_de_typesafe"
JEV_INPUT_PRICE_PER_M="0.042"
```

### 3. Levantar la Base de Datos PostgreSQL
Inicia el contenedor de PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

### 4. Sincronizar Prisma y Cargar Datos Iniciales
Aplica el esquema a la base de datos y genera el cliente de Prisma:

```bash
npx prisma db push
```

*(Opcional) Cargar vacante inicial de demostración:*
```bash
node --env-file=.env.local ./node_modules/.bin/tsx prisma/seed.ts
```

### 5. Iniciar la Aplicación en Modo Desarrollo
```bash
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Cómo Probar el Flujo Completo

1. **Explorar el Cockpit (`/`):**
   - Revisa las vacantes disponibles y utiliza los filtros (`Todos`, `Activos`, `Pausados`, `Cerrados`).
   - Puedes cambiar el estado de cualquier proceso directamente desde la tarjeta.

2. **Entrar a una Vacante (`/vacantes/[id]`):**
   - Arrastra uno o varios currículums en PDF a la zona de carga (puedes usar los archivos de ejemplo en `sample_cvs/`).
   - Si cargas un CV en español, el sistema lo detectará automáticamente y lo marcará como `NO-ENG` sin cobrar nada.

3. **Ejecutar la Evaluación con JEV:**
   - Haz clic en **"Iniciar Evaluación"**.
   - El sistema enviará el texto extraído al modelo `jev-1.13.0`, calculará el score ordinal y ordenará a los candidatos de mayor a menor puntaje.

4. **Gestión Humana y Notas:**
   - En la columna **Etapa Selección**, cambia el estado del candidato (ej: pasa de `Postulado` a `Entrevista`).
   - Haz clic en el botón **"Nota"** para abrir el panel de notas internas del reclutador y guardar observaciones.
   - Pulsa **"Ver CV"** para inspeccionar el texto extraído y el desglose de confianza y dimensiones evaluadas por JEV.

5. **Exportar Resultados:**
   - Haz clic en **"Exportar CSV"** en la parte superior para descargar el reporte consolidado con candidatos, puntajes, etapas y notas.

---

## 🔒 Nota sobre Autenticación (Fase 1 vs Fase 2)

En esta **Fase 1**, la autenticación con NextAuth y la tabla de usuarios (`User`) están completamente configuradas a nivel de backend y base de datos (usuario inicial: `admin@reclutamiento.com` / `admin123`). Sin embargo, el bloqueo estricto de rutas (`middleware.ts`) se mantiene opcional para permitir una evaluación y prueba ágil sin fricción. La activación obligatoria de roles y permisos finos está programada para la **Fase 2**.

---

## 📄 Licencia y Créditos
Desarrollado con TypeSafe AI System One SDK. Todos los derechos reservados.
