/**
 * ==============================================================================
 * MOCK DATABASE: Candidatos Ficticios para Batch Processing
 * ==============================================================================
 * Dataset técnico heterogéneo que emula miles de postulaciones reales:
 * Perfiles Senior, Staff, Frontend puros, Backend puros, DevOps, Juniors y perfiles legados.
 * ==============================================================================
 */

import { Candidate } from '@/types/evaluation';

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-001',
    name: 'Alejandro Morales',
    targetRole: 'Full-Stack Web Developer',
    cvText: `ALEJANDRO MORALES
Senior Full-Stack Engineer & Team Lead
Contacto: alejandro.morales.tech@example.com | Buenos Aires, Argentina

RESUMEN PROFESIONAL:
Ingeniero de Software Senior con más de 8 años de experiencia construyendo plataformas SaaS de alta concurrencia. Especialista en TypeScript, arquitecturas web escalables con Next.js y ecosistemas distribuidos en Node.js y Go.

EXPERIENCIA LABORAL:
Tech Lead Full-Stack — CloudScale Inc. (2021 - Presente)
- Lideré la migración de un monolito legacy a Next.js (App Router) con TypeScript y microservicios en Node.js/Go, mejorando el LCP en un 55% y reduciendo el tiempo de carga a <800ms.
- Diseñé la arquitectura de base de datos relacional en PostgreSQL con sharding y caching multi-capa en Redis, soportando más de 25,000 peticiones por segundo.
- Implementé pipelines de CI/CD en GitHub Actions y orquestación con Docker y Kubernetes sobre AWS (EKS, RDS, CloudFront), logrando disponibilidad del 99.98%.
- Mentoría a 7 ingenieros de software e impulso de prácticas de TDD y Clean Architecture.

Senior Full-Stack Developer — FinTech Global (2018 - 2021)
- Desarrollo de pasarelas de pago utilizando React, TypeScript, Express y PostgreSQL con Prisma ORM.
- Reducción de costos de infraestructura en un 32% mediante Serverless y optimización de queries SQL complejas.

HABILIDADES TÉCNICAS:
- Front-End: React 18, Next.js 14, TypeScript, Tailwind CSS, Zustand, Core Web Vitals, SSR/SSG.
- Back-End: Node.js, Express, NestJS, Go (Golang), REST APIs, GraphQL, gRPC, OAuth2, JWT.
- Base de Datos: PostgreSQL, Redis, Prisma, Drizzle, Indexación B-Tree, transacciones ACID.
- DevOps & Cloud: Docker, Kubernetes, AWS (EKS, RDS, S3), Terraform, CI/CD, Datadog.
- Negocio & Liderazgo: Agile/Scrum, métricas de retención, KPI reduction, optimización de conversión.`,
  },
  {
    id: 'cand-002',
    name: 'Sofía Valenzuela',
    targetRole: 'Full-Stack Web Developer',
    cvText: `SOFÍA VALENZUELA
Frontend Specialist & UI/UX Developer
Contacto: sofia.valenzuela@example.com | Santiago, Chile

RESUMEN PROFESIONAL:
Desarrolladora Frontend con 6 años de experiencia enfocada en diseño de interfaces y aplicaciones reactivas de alta fidelidad visual. Experta en React, Next.js y CSS moderno.

EXPERIENCIA LABORAL:
Senior Frontend Developer — Digital Studio (2022 - Presente)
- Creación de Design Systems complejos en Figma y desarrollo con React, Next.js y Tailwind CSS.
- Optimización de accesibilidad (WCAG AA) y animaciones fluidas con Framer Motion.
- Consumo de APIs REST provistas por el equipo de backend e integración de pasarelas Stripe.

Frontend Developer — E-Commerce Hub (2019 - 2022)
- Desarrollo de componentes reutilizables en Vue.js y React.
- Manejo de estado con Redux Toolkit y Zustand.
- Escasa interacción con bases de datos directas ni despliegue de infraestructura de servidores.

HABILIDADES TÉCNICAS:
- Front-End: React, Next.js, TypeScript, Tailwind CSS, HTML5 semántico, CSS Grid, Framer Motion.
- Back-End: Node.js básico, Express (proyectos pequeños personales), fetch/Axios.
- Base de Datos: Nociones básicas de MongoDB, sin experiencia en PostgreSQL ni optimización de queries.
- DevOps: Vercel, Netlify, Git básico. Sin experiencia en Docker, Kubernetes ni CI/CD avanzado.
- Negocio: Colaboración directa con equipos de producto y diseñadores UX.`,
  },
  {
    id: 'cand-003',
    name: 'Carlos Mendoza',
    targetRole: 'Full-Stack Web Developer',
    cvText: `CARLOS MENDOZA
Staff Backend & Distributed Systems Architect
Contacto: carlos.mendoza.sys@example.com | Bogotá, Colombia

RESUMEN PROFESIONAL:
Arquitecto de Software con 10 años de experiencia enfocado en backend de alta escalabilidad, sistemas distribuidos, mensajería asíncrona y plataformas cloud.

EXPERIENCIA LABORAL:
Staff Backend Engineer — Enterprise Logix (2020 - Presente)
- Arquitectura de microservicios con Go y Node.js, procesando 50M de eventos diarios mediante Apache Kafka y RabbitMQ.
- Modelado avanzado y optimización de PostgreSQL y CockroachDB: particionamiento, índices GiST/GIN y replicación multi-región.
- Infraestructura como Código (IaC) con Terraform en AWS, cluster EKS, balanceadores ALB y monitoreo con Prometheus/Grafana.

Senior Backend Developer — DataStream Co. (2016 - 2020)
- Construcción de APIs REST y gRPC de baja latencia con Python y Go.
- Integración con Redis para cachés distribuidos e invalidación granular.

HABILIDADES TÉCNICAS:
- Back-End: Go, Python, Node.js, REST, gRPC, Kafka, RabbitMQ, Microservicios, Seguridad y TLS.
- Base de Datos: PostgreSQL, Redis, MongoDB, Elasticsearch, SQL tuning, sharding.
- DevOps & Cloud: Docker, Kubernetes, AWS, Terraform, CI/CD, Linux internals.
- Front-End: HTML básico, CSS mínimo, JavaScript plano; sin experiencia práctica en React ni Next.js moderno.
- Negocio: Liderazgo de arquitectura técnica, reducción de latencia p99 en 70%.`,
  },
  {
    id: 'cand-004',
    name: 'Camila Restrepo',
    targetRole: 'Full-Stack Web Developer',
    cvText: `CAMILA RESTREPO
Full-Stack Web Developer
Contacto: camila.restrepo.dev@example.com | Medellín, Colombia

RESUMEN PROFESIONAL:
Desarrolladora Full-Stack con 5 años de experiencia comprobada construyendo aplicaciones web completas de extremo a extremo, desde interfaces interactivas hasta APIs resilientes y despliegues en la nube.

EXPERIENCIA LABORAL:
Full-Stack Developer — TechSphere Solutions (2021 - Presente)
- Desarrollo integral de plataforma SaaS B2B utilizando Next.js (App Router), TypeScript y Tailwind CSS en el cliente.
- Implementación de APIs robustas en Node.js (NestJS) con autenticación JWT, rate limiting y validación Zod.
- Modelado relacional en PostgreSQL gestionado con Prisma ORM, creando migraciones seguras y consultas eficientes.
- Configuración de entornos Docker para desarrollo y despliegues productivos con GitHub Actions en AWS ECS.
- Incremento del 28% en la tasa de activación de usuarios gracias a mejoras de rendimiento y UX.

Web Developer — InnovaLab (2019 - 2021)
- Creación de paneles administrativos interactivos con React y Express.js.
- Conexión a bases de datos PostgreSQL y MySQL; integración de analítica.

HABILIDADES TÉCNICAS:
- Front-End: React, Next.js, TypeScript, Tailwind CSS, TanStack Query, Zustand.
- Back-End: Node.js, NestJS, Express, RESTful APIs, GraphQL básico, validaciones estrictas.
- Base de Datos: PostgreSQL, Prisma ORM, Redis (caching de sesiones), SQL intermedio.
- DevOps & Cloud: Docker, GitHub Actions, AWS (S3, ECS, RDS), Vercel.
- Negocio: Trabajo ágil en Scrum, enfoque en time-to-market y código limpio mantenible.`,
  },
  {
    id: 'cand-005',
    name: 'Mateo Gómez',
    targetRole: 'Full-Stack Web Developer',
    cvText: `MATEO GÓMEZ
Junior Web Developer (Bootcamp Graduate)
Contacto: mateo.gomez.code@example.com | Lima, Perú

RESUMEN:
Entusiasta del desarrollo web recién egresado de Bootcamp intensivo de programación Full-Stack (800 horas). Busco mi primera oportunidad profesional para crecer en un equipo de ingeniería.

PROYECTOS DESTACADOS:
Clone de E-Commerce (Proyecto Final de Bootcamp - 2024)
- Desarrollé una tienda online básica con React, CSS vanilla y backend en Node.js/Express.
- Base de datos MongoDB no relacional con Mongoose para guardar productos y carritos.
- Despliegue gratuito en Render y Vercel.

Blog Personal (2023)
- Sitio estático construido con HTML5, CSS3 y JavaScript interactivo.

HABILIDADES:
- Front-End: HTML5, CSS3, JavaScript (ES6), React básico, Vite.
- Back-End: Node.js básico, Express (rutas CRUD elementales).
- Base de Datos: MongoDB básico. No conozco PostgreSQL ni SQL complejo.
- DevOps: Git, GitHub. Sin experiencia en Docker, Kubernetes, AWS ni CI/CD.
- Negocio: Ganas de aprender, proactividad y trabajo en equipo.`,
  },
  {
    id: 'cand-006',
    name: 'Valentina Ortiz',
    targetRole: 'Full-Stack Web Developer',
    cvText: `VALENTINA ORTIZ
Staff Full-Stack & Platform Engineer
Contacto: valentina.ortiz.staff@example.com | Ciudad de México, México

RESUMEN PROFESIONAL:
Ingeniera de Software Principal con 9 años de experiencia liderando la arquitectura full-stack de productos digitales masivos (>10M usuarios activos mensuales). Experta en TypeScript transversal, performance web, sistemas distribuidos y cultura de ingeniería de clase mundial.

EXPERIENCIA LABORAL:
Staff Platform Engineer — Global Marketplace (2020 - Presente)
- Diseñé y lideré la arquitectura del frontend principal utilizando Next.js con Edge Middleware, Streaming SSR y React Server Components, logrando 99 de score en Core Web Vitals.
- Creé la capa unificada de BFF (Backend-For-Frontend) en TypeScript y Node.js con federación GraphQL y gRPC hacia microservicios en Go.
- Optimizé la persistencia de datos en PostgreSQL mediante particionamiento declarativo y Redis Enterprise, reduciendo el costo de base de datos en $180,000 USD anuales.
- Establecí la estrategia de observabilidad con OpenTelemetry, Datadog y pipelines automatizados de CI/CD con despliegues canary y blue-green en Kubernetes (GKE).
- Liderazgo de 3 pods de ingeniería (18 desarrolladores), estableciendo estándares de código y arquitecturas de referencia.

Senior Full-Stack Engineer — PayFast LatAm (2017 - 2020)
- Construcción del motor de conciliaciones bancarias en Node.js y PostgreSQL.
- Dashboard administrativo en React con visualización de datos en tiempo real mediante WebSockets.

HABILIDADES TÉCNICAS:
- Front-End: Next.js 14, React 18, TypeScript, Tailwind CSS, RSC, Web Workers, Service Workers, Core Web Vitals.
- Back-End: Node.js, NestJS, Go, GraphQL Federation, REST, gRPC, OAuth2, WebSockets.
- Base de Datos: PostgreSQL (experto), Redis Cluster, DynamoDB, Prisma, Drizzle, query optimization.
- DevOps & Cloud: Kubernetes, Docker, GCP (GKE, Cloud Run), Terraform, CI/CD, Prometheus.
- Negocio & Liderazgo: Staff-level impact, arquitectura técnica, reducción de churn, OKRs estratégicos.`,
  },
  {
    id: 'cand-007',
    name: 'Diego Herrera',
    targetRole: 'Full-Stack Web Developer',
    cvText: `DIEGO HERRERA
Backend Developer (Node.js & NoSQL)
Contacto: diego.herrera.dev@example.com | Montevideo, Uruguay

RESUMEN:
Desarrollador Backend con 3 años de experiencia en servicios REST y Node.js.

EXPERIENCIA:
Backend Developer — AppCrafters (2022 - Presente)
- Creación de APIs con Express y JavaScript para aplicaciones móviles.
- Gestión de base de datos MongoDB y creación de endpoints de autenticación con JWT y bcrypt.
- Pruebas unitarias básicas con Jest.

Junior Developer — Soluciones Web (2021 - 2022)
- Mantenimiento de scripts en Node.js y tareas programadas con cron jobs.

HABILIDADES:
- Back-End: Node.js, Express, JavaScript, REST APIs, Postman.
- Base de Datos: MongoDB, Mongoose. Sin conocimientos de SQL relacional, índices ni transacciones.
- Front-End: Nivel principiante; no domino React ni CSS moderno.
- DevOps: Despliegues manuales en VPS Ubuntu; sin Docker ni CI/CD automatizado.`,
  },
  {
    id: 'cand-008',
    name: 'Mariana Silva',
    targetRole: 'Full-Stack Web Developer',
    cvText: `MARIANA SILVA
Full-Stack Engineer
Contacto: mariana.silva.tech@example.com | São Paulo, Brasil / Remoto

RESUMEN:
Ingeniera de software con 4 años construyendo soluciones full-stack para empresas Fintech y de logística.

EXPERIENCIA:
Full-Stack Developer — FinPay (2022 - Presente)
- Desarrollo de aplicaciones web con React, TypeScript y Tailwind CSS en frontend.
- Desarrollo de microservicios en Node.js (Fastify) y PostgreSQL para conciliación de transacciones.
- Dockerización de aplicaciones y automatización de tests con GitHub Actions.

Junior Web Developer — LogiTech (2020 - 2022)
- Desarrollo de vistas en Vue.js y consumo de APIs en Node.js/MySQL.

HABILIDADES:
- Front-End: React, Next.js básico, TypeScript, Tailwind CSS, Vue.js.
- Back-End: Node.js, Fastify, Express, REST APIs, autenticación segura.
- Base de Datos: PostgreSQL, MySQL, TypeORM, Redis básico.
- DevOps: Docker, Git, GitHub Actions, AWS S3.
- Negocio: Orientación a producto y métricas de transaccionalidad.`,
  },
  {
    id: 'cand-009',
    name: 'Lucas Benítez',
    targetRole: 'Full-Stack Web Developer',
    cvText: `LUCAS BENÍTEZ
DevOps & Infrastructure Engineer
Contacto: lucas.benitez.ops@example.com | Córdoba, Argentina

RESUMEN:
Especialista en Infraestructura Cloud, Automatización y SRE con 6 años de experiencia en Kubernetes, Docker y Terraform. Deseo hacer la transición a un rol Full-Stack.

EXPERIENCIA:
Senior DevOps Engineer — CloudFlow (2021 - Presente)
- Gestión de clusters Kubernetes multi-region en AWS con Terraform y Helm.
- Creación de pipelines de CI/CD con ArgoCD y GitLab CI.
- Monitoreo integral con Prometheus, Grafana y Fluentd.

Sysadmin / Automation — Datacenter Sur (2018 - 2021)
- Automatización de tareas de servidores con scripts en Python y Bash.

HABILIDADES:
- DevOps: Kubernetes, Docker, Terraform, Helm, AWS, Linux, CI/CD, GitOps.
- Back-End: Python scripting, conceptos de APIs, Bash. Poco conocimiento de Node.js o frameworks web.
- Base de Datos: Administración de PostgreSQL (backup, réplicas), pero sin modelado ORM ni SQL aplicativo.
- Front-End: Muy limitado; sin experiencia en React, Next.js, CSS ni JavaScript moderno.`,
  },
  {
    id: 'cand-010',
    name: 'Lucía Fernández',
    targetRole: 'Full-Stack Web Developer',
    cvText: `LUCÍA FERNÁNDEZ
Senior Full-Stack Developer (React & Node.js)
Contacto: lucia.fernandez@example.com | Madrid, España / Remoto

RESUMEN:
Desarrolladora Full-Stack con 6 años de experiencia especializada en el ecosistema React/Next.js y Node.js. Foco en calidad de código, accesibilidad y experiencia de usuario.

EXPERIENCIA:
Senior Full-Stack Developer — InnovateX (2021 - Presente)
- Arquitectura de la aplicación web principal en Next.js (App Router), TypeScript y Tailwind CSS.
- Creación de Server Actions y servicios REST/GraphQL con Node.js y PostgreSQL con Drizzle ORM.
- Implementación de cache distribuido con Redis para endpoints críticos, reduciendo el TTFB a 180ms.
- Creación de contenedores Docker y despliegue continuo con GitHub Actions en AWS ECS.

Full-Stack Developer — MediaTech (2018 - 2021)
- Desarrollo de portales de noticias de alto tráfico con React, Redux y Express.js.
- Optimización de SEO técnico y Web Vitals.

HABILIDADES:
- Front-End: Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Vitest.
- Back-End: Node.js, Express, NestJS, REST, GraphQL, microservicios.
- Base de Datos: PostgreSQL, Drizzle ORM, Prisma, Redis, diseño relacional.
- DevOps: Docker, GitHub Actions, AWS (ECS, S3, RDS), Vercel.
- Negocio: Orientación al usuario, entrega continua, sprints ágiles.`,
  },
  {
    id: 'cand-011',
    name: 'Joaquín Rivas',
    targetRole: 'Full-Stack Web Developer',
    cvText: `JOAQUÍN RIVAS
Web Developer (PHP & WordPress)
Contacto: joaquin.rivas.wp@example.com | Asunción, Paraguay

RESUMEN:
Desarrollador web con 5 años creando sitios corporativos y tiendas online con PHP, WordPress y WooCommerce.

EXPERIENCIA:
WordPress Developer — Agencia Creativa (2020 - Presente)
- Maquetación y personalización de temas de WordPress usando PHP, HTML5 y CSS3.
- Uso de plugins de WooCommerce y pasarelas de pago locales.
- Creación de consultas SQL directas en bases de datos MySQL vía phpMyAdmin.

Webmaster — Portal Py (2019 - 2020)
- Mantenimiento web, actualización de contenidos y scripts con jQuery.

HABILIDADES:
- Tecnologías: PHP 7.4/8.0, WordPress, jQuery, MySQL, HTML5, CSS3, cPanel, FTP.
- Front-End Moderno: Sin experiencia en React, Next.js, TypeScript ni frameworks actuales.
- Back-End Moderno: Sin experiencia en Node.js, NestJS ni arquitecturas orientadas a eventos.
- DevOps: Sin Docker, sin CI/CD, sin AWS.`,
  },
  {
    id: 'cand-012',
    name: 'Elena Duarte',
    targetRole: 'Full-Stack Web Developer',
    cvText: `ELENA DUARTE
Tech Lead & Senior Full-Stack Engineer
Contacto: elena.duarte.lead@example.com | San José, Costa Rica

RESUMEN:
Ingeniera de Software y Líder Técnica con 8 años de trayectoria diseñando soluciones cloud nativas de alto rendimiento. Experta en TypeScript de punta a punta, arquitectura de producto y mentoría técnica.

EXPERIENCIA:
Tech Lead Full-Stack — SaaS Factory (2021 - Presente)
- Dirigí el desarrollo de la plataforma SaaS insignia construida con Next.js 14, TypeScript y NestJS.
- Diseñé el esquema de datos en PostgreSQL con Prisma ORM y Redis para colas de trabajo con BullMQ.
- Rediseñé la arquitectura de micro-frontends y Server Actions para reducir el consumo de API en un 40%.
- Infraestructura contenerizada con Docker y despliegues automáticos en Google Cloud Platform (Cloud Run).
- Alineación estratégica de objetivos de ingeniería con metas de ingresos de la empresa.

Senior Software Engineer — CloudApps (2018 - 2021)
- Desarrollo full-stack con React, Redux, Node.js y bases de datos SQL/NoSQL.
- Implementación de pipelines de pruebas E2E con Cypress y Playwright.

HABILIDADES:
- Front-End: Next.js, React, TypeScript, Tailwind CSS, Playwright, Web Vitals, SSR/SSG.
- Back-End: Node.js, NestJS, TypeScript, REST APIs, WebSockets, BullMQ.
- Base de Datos: PostgreSQL, Redis, Prisma ORM, MongoDB, optimización de queries.
- DevOps & Cloud: Docker, GCP, GitHub Actions, CI/CD, Terraform básico.
- Negocio & Liderazgo: Liderazgo técnico, diseño de producto, OKRs, hiring técnico.`,
  },
  {
    id: 'cand-013',
    name: 'Andrés Castro',
    targetRole: 'Full-Stack Web Developer',
    cvText: `ANDRÉS CASTRO
Python Data & API Developer
Contacto: andres.castro.data@example.com | Lima, Perú

RESUMEN:
Desarrollador con 4 años enfocado en backend con Python, procesamiento de datos y desarrollo de APIs con FastAPI.

EXPERIENCIA:
Python Developer — DataCorp (2022 - Presente)
- Creación de APIs REST con FastAPI y Python para exponer modelos de machine learning.
- Consultas SQL en PostgreSQL y Snowflake para extracción y transformación de datos.
- Scripts de automatización y scraping con BeautifulSoup y Selenium.

Junior Backend — TechData (2020 - 2022)
- Desarrollo de endpoints con Django REST Framework y base de datos SQLite/PostgreSQL.

HABILIDADES:
- Back-End: Python, FastAPI, Django, REST APIs, Pydantic, Celery.
- Base de Datos: PostgreSQL, Snowflake, SQL intermedio.
- Front-End: Conocimiento mínimo de HTML y JS básico; sin experiencia en React, Next.js ni CSS moderno.
- DevOps: Docker básico, Git. Sin orquestación ni pipelines avanzados.`,
  },
  {
    id: 'cand-014',
    name: 'Natalia Vega',
    targetRole: 'Full-Stack Web Developer',
    cvText: `NATALIA VEGA
Frontend Developer (React & Web UX)
Contacto: natalia.vega.ui@example.com | Quito, Ecuador

RESUMEN:
Desarrolladora Frontend con 3 años de experiencia en desarrollo web con React y maquetación con Tailwind CSS.

EXPERIENCIA:
Frontend Developer — PixelCraft (2022 - Presente)
- Maquetación de landing pages y dashboards interactivos en React y Tailwind CSS.
- Consumo de endpoints REST con Axios y React Query.
- Pruebas de accesibilidad y diseño responsive.

Web Designer & Junior Dev — Studio Web (2021 - 2022)
- Implementación de maquetas HTML/CSS/JS y prototipos en Figma.

HABILIDADES:
- Front-End: React, JavaScript, HTML5, CSS3, Tailwind CSS, Vite, Figma.
- Back-End: Conocimiento superficial de Node.js; no ha diseñado APIs complejas ni microservicios.
- Base de Datos: Nula experiencia en bases de datos relacionales o NoSQL.
- DevOps: Vercel, Git básico. Sin Docker ni CI/CD.`,
  },
  {
    id: 'cand-015',
    name: 'Gabriel Torres',
    targetRole: 'Full-Stack Web Developer',
    cvText: `GABRIEL TORRES
Senior Full-Stack Engineer
Contacto: gabriel.torres.dev@example.com | Guadalajara, México

RESUMEN:
Ingeniero de Software Senior con 7 años de experiencia construyendo aplicaciones web críticas con el stack moderno de TypeScript, React/Next.js, Node.js y arquitecturas cloud en AWS.

EXPERIENCIA LABORAL:
Senior Full-Stack Developer — NeuraTech (2021 - Presente)
- Arquitectura e implementación de aplicación web en Next.js (App Router), TypeScript y Tailwind CSS.
- Diseño de servicios backend escalables en Node.js (NestJS) con PostgreSQL y Prisma ORM.
- Implementación de colas en Redis para procesamiento en background y notificaciones en tiempo real vía WebSockets.
- Configuración de pipelines en GitHub Actions para pruebas automatizadas y despliegue en AWS con Docker y ECS.
- Reducción del tiempo de respuesta del backend en un 38% mediante query optimization y caching.

Full-Stack Developer — Omnia Systems (2018 - 2021)
- Desarrollo de aplicaciones web en React, TypeScript y Express.js.
- Gestión de base de datos PostgreSQL y MySQL con foco en seguridad y sanitización de datos.

HABILIDADES TÉCNICAS:
- Front-End: Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query, Web Vitals, SSR.
- Back-End: Node.js, NestJS, Express, REST, GraphQL, WebSockets, JWT, OAuth2.
- Base de Datos: PostgreSQL, Redis, Prisma ORM, SQL tuning, transacciones.
- DevOps & Cloud: Docker, AWS (ECS, RDS, S3), GitHub Actions, CI/CD, monitoreo.
- Negocio & Liderazgo: Trabajo en equipo ágil, revisión de código rigurosa, orientación al producto.`,
  },
];
