# 🚀 JEV Enterprise Suite — Multi-POC (RRHH & Finanzas)

Plataforma empresarial de inteligencia artificial determinista impulsada por **TypeSafe AI (JEV - System One Discriminative Model)**, **Next.js 14 (App Router)**, **PostgreSQL 16**, **Prisma ORM** y **Tailwind CSS**.

Este repositorio contiene dos soluciones clave (*Proof of Concepts*) listas para demostración ejecutiva:

1. **👥 Módulo RRHH — Evaluador de CVs Técnicos (`/vacantes`):**  
   Evaluación ordinal determinista (0–4.0 pts) de currículums en PDF en inglés, detección previa de idioma, gestión de etapas del funnel de selección, notas del reclutador y exportación a CSV. Inferencia real a **$0.042 / 1M tokens** (~$0.00008 USD por CV).

2. **🧾 Módulo Finanzas — Auditor Inteligente de Facturas Manuales Formulario 110 (`/finanzas`):**  
   Auditoría en tiempo real de facturas físicas/manuales de empleados dependientes (normativa tributaria boliviana RC-IVA). Valida coherencia matemática ($\sum \text{ítems} = \text{Total}$), cotejo estricto de identidad (CI / Nombre), umbral de montos elevados (> 10.000 Bs) y detección de compras anómalas (ej. ascensores, maquinaria pesada) mediante juicio semántico con JEV. Incluye **100 facturas de prueba**, procesamiento en streaming con Server-Sent Events (SSE), visor de talonario físico original y botón de reset para repetir la demo.

---

## 🌟 Características de la Suite

### 1. Portal Centralizado Hub (`/`)
* Punto de partida con acceso directo y métricas en vivo para ambos departamentos (Recursos Humanos y Finanzas).

### 2. Evaluador de CVs Técnicos (`/vacantes`)
* Rúbricas ordinales configurables (Skills, Producción, Fundamentos, Liderazgo).
* Filtro de calidad lingüística (detección automática con `franc` para procesar únicamente CVs en inglés sin cobrar tokens por documentos descartados).
* Extracción robusta de PDFs en servidor (`unpdf`).
* Funnel de selección interactivo (`Postulado` → `En Revisión` → `Entrevista` → `Oferta` → `Contratado` → `Descartado`).
* Modal de notas internas del reclutador y exportación a CSV.

### 3. Auditor de Facturas Manuales RC-IVA (`/finanzas`)
* **Proceso de demostración precargado:** *Presentación de facturas Carlos Morales Octubre 2026* con 100 facturas manuales pendientes.
* **Procesamiento en Vivo (SSE Streaming):** Cronómetro en vivo, barra de progreso interactiva y contador de costo real acumulado ($0.042 / 1M input tokens).
* **Visor de Factura Física:** Renderiza el talonario manual preimpreso tradicional con pie de imprenta legal, N° de factura rojo, sello húmedo de cancelado y total en palabras.
* **Matriz de Auditoría JEV:** Veredicto claro (`APROBADA`, `REVISIÓN MANUAL`, `RECHAZADA`) con desglose de razones matemáticas, identidad y juicio semántico.
* **Botón Reiniciar Demo (Reset):** Restablece las 100 facturas a estado pendiente y limpia las evaluaciones con un solo clic para repetir la presentación tantas veces como sea necesario.

---

## 💰 Modelo de Costos Oficial (TypeSafe AI)

A diferencia de LLMs generativos tradicionales costosos e impredecibles, **JEV (System One)** es un modelo discriminativo de decisiones atómicas:

| Concepto | Tarifa Oficial |
| :--- | :--- |
| **Tokens de Entrada** | **$0.042 por millón de tokens** ($0.000000042 / token) |
| **Tokens de Salida** | **$0.00 (Gratis)** |
| **Costo por CV promedio** | **~$0.00008 USD** (100 CVs ≈ $0.008 USD) |
| **Costo por Factura promedio** | **~$0.000035 USD** (100 Facturas ≈ $0.0035 USD) |

$$\text{Costo USD} = \frac{\text{Tokens de Entrada} \times 0.042}{1,000,000}$$

---

## 🚀 Guía de Puesta en Marcha (Clonar en Otra Máquina)

Sigue estos sencillos pasos para levantar el proyecto desde cero en cualquier máquina (Mac, Linux o Windows con WSL2):

### 1. Requisitos Previos
* **Node.js** v18+ (recomendado v20+)
* **Docker & Docker Compose** (para la base de datos PostgreSQL)
* **Git**

### 2. Clonar el Repositorio
```bash
git clone git@github.com:LucasGrc/JEV-CV-Evaluator.git
cd JEV-CV-Evaluator
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` como `.env`:
```bash
cp .env.example .env
```

*(Opcional)* Si cuentas con tu propia API Key de TypeSafe AI, edita el archivo `.env` o `.env.local` e ingresa tu clave:
```env
TYPESAFE_AI_API_KEY="tu_api_key_de_typesafe"
```
> **Nota:** Si no configuras una API key, el sistema cuenta con modos de prueba y simulación estadística para poder navegar y evaluar las interfaces sin bloquearse.

### 5. Levantar la Base de Datos PostgreSQL
Inicia el contenedor Docker con la base de datos configurada:
```bash
docker compose up -d
```
> Esto iniciará un contenedor `cv_evaluator_postgres` en el puerto `5432` con usuario `cv_admin` y base de datos `cv_evaluator`.

### 6. Sincronizar Esquema de Base de Datos
Genera el cliente de Prisma y crea las tablas automáticamente:
```bash
npm run db:push
```

### 7. Cargar Datos de Demostración (Seed)
Ejecuta la siembra automática que creará los usuarios administradores, las vacantes técnicas de RRHH y el proceso de 100 facturas para Finanzas:
```bash
npm run db:seed
```
> También puedes ejecutar los seeds de forma independiente si lo prefieres:
> - `npm run db:seed:rrhh` (Carga vacantes y usuario de RRHH)
> - `npm run db:seed:finanzas` (Carga el proceso y las 100 facturas de Carlos Morales)

### 8. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre en tu navegador:  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Demostraciones en Vivo

### A. Demostración de Finanzas (Facturas Manuales Formulario 110)
1. Entra a `http://localhost:3000` y haz clic en **"Ir a Módulo Finanzas"** (o navega a `/finanzas/procesos`).
2. Abre el proceso activo: **`Presentación de facturas Carlos Morales Octubre 2026`**.
3. Haz clic en **`[ ⚡ Auditar 100 Facturas en Tiempo Real con JEV ]`**.
4. Observa cómo el motor procesa en streaming cada factura, actualiza el cronómetro, calcula el costo en dólares y clasifica las facturas en tiempo real.
5. Haz clic en **`[ 🧾 Ver Factura ]`** en cualquier fila para ver el talonario físico preimpreso, o en **`[ 🛡️ Auditoría JEV ]`** para ver el informe del veredicto.
6. Al terminar, haz clic en **`[ 🔄 Reiniciar las 100 Facturas a Pendientes (Repetir Demo) ]`** para reiniciar todo y volver a presentar la demo.

### B. Demostración de Recursos Humanos (Evaluador de CVs)
1. Entra a `http://localhost:3000` y haz clic en **"Ir a Módulo RRHH"** (o navega a `/vacantes`).
2. Abre la vacante: **`Senior Full-Stack Engineer (Next.js & TypeScript)`**.
3. Carga uno o varios CVs de la carpeta `sample_cvs/` (arrastra y suelta).
4. Haz clic en **`Iniciar Evaluación`** para ver la clasificación ordinal, niveles de confianza y cálculo de costos.
5. Gestiona las etapas de selección de los candidatos, agrega notas y descarga el reporte consolidado en **CSV**.

---

## 🛡️ Seguridad, Privacidad y Cumplimiento
* **Almacenamiento Local-First:** Los archivos originales (PDFs y fotos) se almacenan localmente y nunca abandonan la infraestructura corporativa.
* **Compromiso Contractual de No Entrenamiento:** TypeSafe AI no utiliza datos de clientes para entrenar ni mejorar modelos generales.
* **Zero Data Retention (ZDR):** En el nivel corporativo, los datos se procesan en memoria volátil cifrada (TLS 1.3) y se eliminan inmediatamente tras devolver el veredicto.
* **Preparado para On-Premise / VPC:** En fase de producción, los modelos pueden desplegarse dentro de la VPC privada o datacenter de la empresa si las normativas sectoriales (ej. ASFI) así lo requieren.

---

## 🏛️ Estructura del Código

```
cv-evaluator/
├── docker-compose.yml             # Contenedor PostgreSQL 16
├── .env.example                   # Plantilla de variables de entorno para clones limpios
├── package.json                   # Scripts de ejecución, build y seed
├── prisma/
│   ├── schema.prisma              # Esquema unificado (RRHH + Finanzas)
│   ├── seed.ts                    # Datos de prueba para RRHH (vacantes y admin)
│   └── seed-100-invoices.ts       # Datos de prueba para Finanzas (100 facturas manuales)
├── sample_cvs/                    # 5 CVs de prueba en PDF (inglés y español)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Hub principal multi-módulo
│   │   ├── vacantes/              # Vistas de gestión y evaluación de CVs (RRHH)
│   │   ├── finanzas/              # Vistas de procesos y auditoría de facturas (Finanzas)
│   │   └── api/                   # Endpoints REST y streaming SSE
│   ├── components/                # Componentes React (Visor de factura, tablas, modales)
│   └── lib/                       # Motores de inferencia (JEV SDK, parsers, costes)
```

---

## 📄 Licencia
Desarrollado con TypeSafe AI System One SDK. Todos los derechos reservados.
