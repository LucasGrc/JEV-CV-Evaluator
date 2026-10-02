# 🚀 CV Evaluator - Batch Processing & Real-Time Leaderboard (TypeSafe AI JEV)

Plataforma de evaluación masiva de currículums (Batch Processing) y **Tabla Clasificatoria (Leaderboard)** en tiempo real, diseñada con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS Puro** y **TypeSafe AI (JEV)** para filtrar candidatos al perfil de **Full-Stack Web Developer**.

---

## 🏛️ Arquitectura del Sistema

```
cv-evaluator/
├── .env.local.example          # Plantilla de variables de entorno seguras
├── .gitignore                  # Exclusión estricta de .env.local y dependencias
├── next.config.mjs             # Configuración de Next.js
├── package.json                # Next.js 14, React 18, Tailwind, Lucide, pdf-parse
├── postcss.config.js           # PostCSS
├── tailwind.config.ts          # Tailwind CSS puro (animaciones shimmer)
├── tsconfig.json               # TypeScript con alias '@/...'
└── src/
    ├── app/
    │   ├── actions/
    │   │   ├── evaluate.ts       # Server Action individual para PDF
    │   │   └── evaluate-batch.ts # ⚡ Server Action por lotes con concurrencia controlada
    │   ├── globals.css           # Estilos globales y máscaras shimmer
    │   ├── layout.tsx            # Shell principal y metadatos
    │   └── page.tsx              # 🏆 Sala de Control: Leaderboard y métricas financieras en vivo
    ├── lib/
    │   └── typesafe.ts           # 🤖 Cliente centralizado de TypeSafe AI (JEV)
    ├── mocks/
    │   └── candidates.ts         # 📦 Dataset con 15 candidatos técnicos heterogéneos
    └── types/
        └── evaluation.ts         # 📐 Esquemas 't' e interfaces TypeScript
```

---

## ⚡ Procesamiento por Lotes y Control de Concurrencia

El sistema procesa la lista de candidatos mediante una cola de trabajo con concurrencia controlada (`CONCURRENCY_LIMIT = 2` o `3`) para evitar superar los límites de tasa (Rate Limits) de la API de TypeSafe AI.

A medida que cada candidato se evalúa:
1. **La fila transiciona** de estado *"En cola..."* o *"Analizando..."* (con shimmer skeleton `animate-pulse`) a su resultado final.
2. **El Leaderboard se reordena reactivamente** colocando al candidato en su posición exacta según su score ponderado.
3. **El contador gigante de gasto acumulado** suma los costos de inferencia en tiempo real (`$ USD`).
4. **Resiliencia ante fallos individuales:** Si una llamada falla, se registra el error en la fila correspondiente y la cola continúa procesando a los demás candidatos sin interrumpir el lote.

---

## 📊 Reglas de Negocio & Ponderación Técnica

| Categoría | Ponderación | Criterios Evaluados |
| :--- | :---: | :--- |
| **Front-End Development** | **25%** | React, Next.js, TypeScript, CSS moderno, Web Vitals, SSR |
| **Back-End Architecture** | **25%** | Node.js, Go/Python, APIs REST/GraphQL, Autenticación, Concurrencia |
| **Base de Datos & Persistencia** | **15%** | PostgreSQL, Redis, ORMs (Prisma/Drizzle), Indexación, SQL |
| **DevOps & Cloud** | **15%** | Docker, Kubernetes, CI/CD, AWS/GCP, Automatización |
| **Impacto de Negocio & Liderazgo** | **20%** | Métricas de impacto, arquitectura de producto, liderazgo |

- **Umbral de Calificación:** Score $\ge 70$ puntos $\rightarrow$ **PASA A ENTREVISTA** (Verde).
- **No Califica:** Score $< 70$ puntos $\rightarrow$ **RECHAZADO** (Rojo).

---

## 💰 Métrica Financiera

El costo de cada consulta se calcula con base en tokens reales o heurística BPE (precios de referencia gpt-4o / TypeSafe AI tier):
- Entrada: **$2.50 / 1M tokens** ($0.0000025 / token)
- Salida: **$10.00 / 1M tokens** ($0.0000100 / token)

$$\text{Costo Total} = \sum_{i=1}^{N} \left( \frac{\text{PromptTokens}_i \times \$2.50}{1,000,000} + \frac{\text{CompTokens}_i \times \$10.00}{1,000,000} \right)$$

---

## 🚀 Puesta en Marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (opcional si pruebas en modo demo)
cp .env.local.example .env.local

# 3. Iniciar en desarrollo
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) y pulsa **"Iniciar Procesamiento por Lote"**.
