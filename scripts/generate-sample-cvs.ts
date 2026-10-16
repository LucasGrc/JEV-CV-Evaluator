import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface ResumeData {
  fileName: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    period: string;
    bullets: string[];
  }>;
  education: string;
}

const SAMPLE_RESUMES: ResumeData[] = [
  // ---------------------------------------------------------------------------
  // 1. TOP SENIOR FULL-STACK (El Candidato Ideal - Sobresaliente)
  // ---------------------------------------------------------------------------
  {
    fileName: '01_Alexander_Wright_Senior_FullStack.pdf',
    fullName: 'Alexander Wright',
    title: 'Senior Full-Stack Engineer',
    email: 'alex.wright.dev@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    summary:
      'Senior Full-Stack Engineer with 8+ years of experience building high-scale web platforms using Next.js, React, TypeScript, and Node.js. Proven track record leading squads, reducing Core Web Vitals LCP by 45%, and architecting mission-critical microservices with PostgreSQL, Redis, and Docker on AWS.',
    skills: [
      'Next.js 14 (App Router, Server Components, SSR)',
      'React, TypeScript, Tailwind CSS, Web Vitals',
      'Node.js, Express, NestJS, REST & GraphQL APIs',
      'PostgreSQL, Prisma ORM, Redis caching, Data Modeling',
      'Docker, Kubernetes, AWS (ECS, S3, RDS), GitHub Actions CI/CD',
    ],
    experience: [
      {
        role: 'Lead Full-Stack Engineer',
        company: 'Vanguard Tech Solutions',
        period: '2021 - Present',
        bullets: [
          'Architected and migrated legacy monolith to Next.js 14 App Router and TypeScript, handling 1.2M daily active users.',
          'Designed high-throughput PostgreSQL schemas with Prisma and implemented Redis caching, cutting latency by 60%.',
          'Mentored 6 junior/mid engineers and established strict code review and CI/CD automation standards.',
        ],
      },
      {
        role: 'Senior Software Engineer',
        company: 'CloudScale Dynamics',
        period: '2018 - 2021',
        bullets: [
          'Engineered event-driven Node.js microservices integrated with Docker container pipelines.',
          'Built responsive front-end design systems with React and strict accessibility (a11y) compliance.',
        ],
      },
    ],
    education: 'B.S. in Computer Science - University of California, Berkeley (2016)',
  },

  // ---------------------------------------------------------------------------
  // 2. LEAD ARCHITECT & ENGINEERING MANAGER (Máximo Liderazgo y Escala)
  // ---------------------------------------------------------------------------
  {
    fileName: '02_Beatriz_Mendoza_Lead_Architect.pdf',
    fullName: 'Beatriz Mendoza',
    title: 'Lead Software Architect & Engineering Manager',
    email: 'beatriz.mendoza@example.com',
    phone: '+1 (555) 312-7890',
    location: 'New York, NY',
    summary:
      'Staff Software Architect with 11+ years leading distributed engineering teams and delivering enterprise SaaS platforms. Expert in TypeScript, Next.js enterprise architecture, micro-frontends, multi-tenant PostgreSQL systems, and containerized cloud operations on AWS. Passionate about engineering excellence and business outcomes.',
    skills: [
      'Enterprise Architecture, Next.js App Router, React, TypeScript',
      'Distributed Systems, Node.js, Go microservices, Event-driven architecture',
      'PostgreSQL sharding, Prisma ORM, Connection pooling, Redis',
      'Docker, Multi-cluster Kubernetes, AWS, Terraform, GitOps',
      'Engineering Leadership, Agile Coaching, Tech Strategy, System Design',
    ],
    experience: [
      {
        role: 'Head of Web Engineering',
        company: 'FinNova Technologies',
        period: '2020 - Present',
        bullets: [
          'Led a department of 14 full-stack and platform engineers delivering core banking customer portals.',
          'Spearheaded transition to modern TypeScript micro-frontends and Next.js, achieving 99.99% service availability.',
          'Collaborated with VP of Product to define engineering roadmaps and reduced customer bug escalations by 52%.',
        ],
      },
      {
        role: 'Principal Full-Stack Engineer',
        company: 'Solaria Cloud Systems',
        period: '2016 - 2020',
        bullets: [
          'Architected global real-time notification engine with Node.js and WebSockets processing 10M events/day.',
          'Designed relational data structures on PostgreSQL handling $45M monthly transactional flow.',
        ],
      },
    ],
    education: 'M.S. in Computer Science - Columbia University (2015)',
  },

  // ---------------------------------------------------------------------------
  // 3. PRINCIPAL BACKEND & DATABASE SPECIALIST (Fuerte en Backend, Medio en Frontend)
  // ---------------------------------------------------------------------------
  {
    fileName: '03_David_Chen_Principal_Backend.pdf',
    fullName: 'David Chen',
    title: 'Principal Backend Architect',
    email: 'david.chen@example.com',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    summary:
      'Principal Backend Engineer with 10+ years specializing in distributed systems, high-volume database architecture, and microservices in Go and Node.js. Extensive experience with PostgreSQL indexing, sharding, distributed transactions, and Dockerized deployments.',
    skills: [
      'Go (Golang), Node.js, Python, Java',
      'PostgreSQL (Query Optimization, Sharding, B-Tree Indexing)',
      'Redis Caching, Apache Kafka, RabbitMQ, Event Sourcing',
      'Microservices Architecture, gRPC, REST, GraphQL',
      'Docker, Kubernetes, AWS Aurora, Distributed Transactions',
    ],
    experience: [
      {
        role: 'Principal Backend Architect',
        company: 'DataStream Global',
        period: '2019 - Present',
        bullets: [
          'Architected distributed ingestion engine in Go processing over 50,000 requests/second with sub-10ms latency.',
          'Optimized enterprise PostgreSQL databases containing 400M+ rows, slashing query execution times from 4.2s to 65ms.',
          'Defined company-wide database guidelines, migration safety patterns, and connection pooling policies.',
        ],
      },
      {
        role: 'Senior Backend Engineer',
        company: 'Helios Logistics',
        period: '2015 - 2019',
        bullets: [
          'Built high-availability inventory sync APIs with Node.js, PostgreSQL, and Docker container clusters.',
        ],
      },
    ],
    education: 'B.S. in Computer Science - University of Texas at Austin (2014)',
  },

  // ---------------------------------------------------------------------------
  // 4. STAFF CLOUD & DEVOPS PLATFORM (Especialista en Infraestructura)
  // ---------------------------------------------------------------------------
  {
    fileName: '04_Elena_Rostova_Staff_DevOps.pdf',
    fullName: 'Elena Rostova',
    title: 'Staff Cloud & Platform Engineer',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 987-6543',
    location: 'Seattle, WA',
    summary:
      'Staff Infrastructure & Platform Engineer with 9 years of expertise architecting multi-region Kubernetes clusters, automated CI/CD pipelines, and Infrastructure as Code on AWS/GCP. Expert in Docker containerization, observability with Prometheus/Grafana, and high availability systems.',
    skills: [
      'Kubernetes (EKS, GKE), Docker, Container Security',
      'Terraform, CloudFormation, Ansible, IaC',
      'AWS (IAM, VPC, EKS, RDS, S3), GCP, Hybrid Cloud',
      'CI/CD Pipelines (GitHub Actions, GitLab CI, ArgoCD)',
      'Go, Python scripting, PostgreSQL administration, Linux kernel tuning',
    ],
    experience: [
      {
        role: 'Staff DevOps / Platform Engineer',
        company: 'Apex Cloud Systems',
        period: '2020 - Present',
        bullets: [
          'Spearheaded enterprise migration of 80+ microservices to Kubernetes clusters with zero downtime.',
          'Reduced cloud infrastructure expenditure by $280K annually through automated auto-scaling and spot instances.',
          'Implemented GitOps workflows with ArgoCD and automated container vulnerability scanning in CI/CD.',
        ],
      },
      {
        role: 'Senior DevOps Engineer',
        company: 'Metro Systems',
        period: '2017 - 2020',
        bullets: [
          'Automated multi-account AWS environments using Terraform modules and strict IAM policies.',
          'Maintained 99.99% service availability for global payment gateway APIs.',
        ],
      },
    ],
    education: 'M.S. in Software Engineering - University of Washington (2017)',
  },

  // ---------------------------------------------------------------------------
  // 5. MID-LEVEL FULL-STACK (Cumple los mínimos, balance intermedio)
  // ---------------------------------------------------------------------------
  {
    fileName: '05_Sophia_Taylor_Mid_FullStack.pdf',
    fullName: 'Sophia Taylor',
    title: 'Full-Stack Software Engineer',
    email: 'sophia.taylor.dev@example.com',
    phone: '+1 (555) 432-1098',
    location: 'Chicago, IL',
    summary:
      'Product-driven Full-Stack Engineer with 3.5 years of experience building modern web applications with React, Next.js, TypeScript, and Node.js. Experienced working in Agile squads, collaborating on relational database design with PostgreSQL, and deploying services using Docker.',
    skills: [
      'React, Next.js, TypeScript, JavaScript (ES6+)',
      'Tailwind CSS, HTML5, CSS3, Responsive Design',
      'Node.js, Express, REST APIs, JSON Web Tokens (JWT)',
      'PostgreSQL, Prisma ORM, SQL queries',
      'Docker basics, Git, GitHub Actions, AWS S3/EC2',
    ],
    experience: [
      {
        role: 'Software Engineer',
        company: 'BrightWave Labs',
        period: '2022 - Present',
        bullets: [
          'Developed interactive analytics dashboard features using Next.js, TypeScript, and Tailwind CSS.',
          'Implemented RESTful endpoints in Node.js/Express with PostgreSQL data persistence via Prisma ORM.',
          'Containerized local development workflows using Docker Compose, reducing environment setup time for new devs.',
        ],
      },
      {
        role: 'Associate Software Developer',
        company: 'Orbit Interactive',
        period: '2021 - 2022',
        bullets: [
          'Contributed to client-facing web applications using React and Redux.',
          'Wrote unit and integration tests with Jest, achieving 80% code coverage on core billing modules.',
        ],
      },
    ],
    education: 'B.S. in Information Systems - University of Illinois Urbana-Champaign (2021)',
  },

  // ---------------------------------------------------------------------------
  // 6. SENIOR FRONTEND & UI/UX (Fuerte en Frontend, Débil en Backend y Docker)
  // ---------------------------------------------------------------------------
  {
    fileName: '06_Marcus_Vance_Senior_Frontend.pdf',
    fullName: 'Marcus Vance',
    title: 'Senior Front-End & UI Engineer',
    email: 'marcus.vance.ui@example.com',
    phone: '+1 (555) 678-9012',
    location: 'Portland, OR',
    summary:
      'Senior Frontend Developer with 7 years of deep specialization in React, Next.js, web animations, and design systems. Renowned for pixel-perfect implementations, cutting-edge CSS architecture, and Core Web Vitals optimization. Light exposure to Node.js backend endpoints; zero Docker or Kubernetes operations.',
    skills: [
      'React, Next.js, TypeScript, JavaScript (ESNext)',
      'Tailwind CSS, Styled Components, Framer Motion, CSS Grid',
      'Web Performance (LCP, INP, CLS), Accessibility (WCAG 2.1 AA)',
      'Figma to Code, Design Tokens, Storybook component libraries',
      'REST API consumption, GraphQL client (Apollo)',
    ],
    experience: [
      {
        role: 'Senior UI/Frontend Engineer',
        company: 'PixelCraft Studios',
        period: '2020 - Present',
        bullets: [
          'Created and maintained enterprise design system used across 8 customer web applications.',
          'Boosted Lighthouse performance scores from 64 to 98 across all primary landing pages.',
          'Mentored UI designers on interactive states and design-token synchronization.',
        ],
      },
      {
        role: 'Frontend Web Developer',
        company: 'Elevation Media Group',
        period: '2017 - 2020',
        bullets: [
          'Built marketing websites and interactive widgets using React, Redux, and SASS.',
        ],
      },
    ],
    education: 'B.A. in Digital Arts & Computer Science - University of Oregon (2017)',
  },

  // ---------------------------------------------------------------------------
  // 7. JUNIOR FRONTEND DEVELOPER (Descarte por nivel bajo / sin fundamentos sólidos)
  // ---------------------------------------------------------------------------
  {
    fileName: '07_Lucas_Miller_Junior_Frontend.pdf',
    fullName: 'Lucas Miller',
    title: 'Junior Front-End Developer',
    email: 'lucas.miller.jr@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Denver, CO',
    summary:
      'Junior Front-End Developer with 10 months of experience building basic responsive websites with HTML, CSS, JavaScript, and introductory React. Seeking an entry-level position to continue learning modern full-stack development, backend APIs, and cloud deployments under senior mentorship.',
    skills: [
      'HTML5, CSS3, Modern JavaScript (ES6+)',
      'Basic React, Vite, Bootstrap, Tailwind CSS',
      'Git basics, GitHub, npm, Webpack configuration',
      'Introductory Node.js and REST API consumption',
    ],
    experience: [
      {
        role: 'Junior Web Developer (Intern)',
        company: 'Creative Pixels Agency',
        period: '2023 - 2024',
        bullets: [
          'Built landing pages and static marketing sites using HTML, CSS, and vanilla JavaScript.',
          'Assisted senior developers with React component styling and fixing responsive layout bugs.',
          'Participated in daily standups and maintained Jira tickets.',
        ],
      },
    ],
    education: 'Full-Stack Web Development Bootcamp Certificate - CodeCraft (2023)',
  },

  // ---------------------------------------------------------------------------
  // 8. LEGACY ENTERPRISE DEVELOPER (Descarte por Stack Obsoleto: Java 8 / PHP / SVN)
  // ---------------------------------------------------------------------------
  {
    fileName: '08_Robert_Kowalski_Legacy_Backend.pdf',
    fullName: 'Robert Kowalski',
    title: 'Senior Enterprise Systems Developer',
    email: 'robert.kowalski.systems@example.com',
    phone: '+1 (555) 789-0123',
    location: 'Pittsburgh, PA',
    summary:
      'Senior Enterprise Software Developer with 12 years maintaining legacy corporate systems. Extensive background in Java 8, Spring MVC, PHP 5.6, Oracle Database, and SOAP XML web services on Apache Tomcat. Traditional Waterfall development lifecycle and Subversion (SVN) version control.',
    skills: [
      'Java 8, Spring MVC, JSP, Servlets, Hibernate',
      'PHP 5.6 / 7.0, Apache Tomcat, IIS Server',
      'Oracle 11g Database, PL/SQL, Stored Procedures, DB2',
      'SOAP Web Services, XML, WSDL, Enterprise Service Bus (ESB)',
      'Subversion (SVN), Ant, Maven, Waterfall Methodology',
    ],
    experience: [
      {
        role: 'Senior Java Systems Developer',
        company: 'Keystone Legacy Solutions',
        period: '2016 - Present',
        bullets: [
          'Maintained internal enterprise payroll system built on Java 8 Spring Framework and Oracle 11g.',
          'Authored complex PL/SQL stored procedures and scheduled batch jobs.',
          'Supported legacy SOAP APIs communicating with vendor billing gateways.',
        ],
      },
      {
        role: 'PHP / Web Developer',
        company: 'Tri-State Telecom Systems',
        period: '2012 - 2016',
        bullets: [
          'Developed internal administrative intranet portals with PHP and MySQL.',
        ],
      },
    ],
    education: 'B.S. in Information Technology - University of Pittsburgh (2012)',
  },

  // ---------------------------------------------------------------------------
  // 9. DATA SCIENTIST & ML ANALYST (Descarte por Perfil No Afín a Desarrollo Web)
  // ---------------------------------------------------------------------------
  {
    fileName: '09_Priya_Sharma_Data_Scientist.pdf',
    fullName: 'Priya Sharma',
    title: 'Data Scientist & Machine Learning Specialist',
    email: 'priya.sharma.ml@example.com',
    phone: '+1 (555) 890-1234',
    location: 'Boston, MA',
    summary:
      'Data Scientist with 5 years of experience in statistical data modeling, predictive analytics, and machine learning pipelines using Python, Pandas, Scikit-Learn, and SQL. Expert in exploratory data analysis and Jupyter notebooks; minimal interest in front-end or full-stack web application engineering.',
    skills: [
      'Python, R, SQL (Analytical Queries), Pandas, NumPy',
      'Scikit-Learn, TensorFlow, XGBoost, Regression, Clustering',
      'Tableau, PowerBI, Matplotlib, Seaborn Data Visualization',
      'Jupyter Notebooks, Google BigQuery, Snowflake, ETL pipelines',
      'Statistical Hypothesis Testing, A/B Testing, Time Series',
    ],
    experience: [
      {
        role: 'Senior Data Scientist',
        company: 'BioMetric Analytics Corp',
        period: '2021 - Present',
        bullets: [
          'Built predictive churn models with XGBoost achieving 87% precision across 500,000 customer cohorts.',
          'Engineered automated ETL pipelines aggregating clinical trial data in Google BigQuery.',
          'Presented weekly data insights and dashboards to C-level stakeholders.',
        ],
      },
      {
        role: 'Data Analyst',
        company: 'Quantum Market Research',
        period: '2019 - 2021',
        bullets: [
          'Cleaned and transformed unstructured survey data using Pandas and SQL.',
        ],
      },
    ],
    education: 'M.S. in Applied Statistics & Data Science - Boston University (2019)',
  },

  // ---------------------------------------------------------------------------
  // 10. CANDIDATO EN IDIOMA ESPAÑOL (Descarte por Política de Idioma - Costo $0)
  // ---------------------------------------------------------------------------
  {
    fileName: '10_Carlos_Gomez_FullStack_Espanol.pdf',
    fullName: 'Carlos Gómez Martínez',
    title: 'Desarrollador Full-Stack Senior',
    email: 'carlos.gomez@ejemplo.es',
    phone: '+34 612 345 678',
    location: 'Madrid, España',
    summary:
      'Ingeniero de Software Senior con más de 7 años de experiencia desarrollando aplicaciones web empresariales. Especializado en JavaScript, TypeScript, React y Node.js con bases de datos relacionales PostgreSQL y despliegues con contenedores Docker. Liderazgo de equipos técnicos multidisciplinarios y mentoría.',
    skills: [
      'Desarrollo Front-End con React, Next.js y TypeScript',
      'Arquitectura Back-End con Node.js, Express y microservicios',
      'Bases de datos relacionales PostgreSQL, MySQL y Prisma ORM',
      'Contenedores Docker, integración continua CI/CD y despliegues en la nube',
      'Metodologías ágiles Scrum, arquitectura hexagonal y código limpio',
    ],
    experience: [
      {
        role: 'Líder Técnico de Desarrollo',
        company: 'Soluciones Digitales Ibéricas',
        period: '2020 - Actualidad',
        bullets: [
          'Lideró el equipo de ingeniería en la migración de plataformas hacia microservicios en la nube.',
          'Diseño y optimización de esquemas de bases de datos relacionales en PostgreSQL.',
          'Implementación de pipelines automatizados de CI/CD para despliegues con cero tiempo de inactividad.',
        ],
      },
      {
        role: 'Desarrollador Web Senior',
        company: 'Innovación Tecnológica Madrid',
        period: '2017 - 2020',
        bullets: [
          'Desarrolló aplicaciones web interactivas con React y APIs RESTful sobre Node.js.',
        ],
      },
    ],
    education: 'Grado en Ingeniería Informática - Universidad Politécnica de Madrid (2017)',
  },
];

async function createPDF(data: ResumeData, outputPath: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  // Header: Name
  page.drawText(data.fullName, {
    x: 50,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  y -= 22;

  // Title
  page.drawText(data.title, {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 18;

  // Contact info
  const contact = `${data.email}  |  ${data.phone}  |  ${data.location}`;
  page.drawText(contact, {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  // Divider line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 20;

  // Section: Summary
  page.drawText('PROFESSIONAL SUMMARY', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.35),
  });
  y -= 15;

  // Wrap summary text
  const words = data.summary.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (testLine.length > 88) {
      page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 22;
  }

  // Section: Core Skills
  page.drawText('TECHNICAL SKILLS & COMPETENCIES', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.35),
  });
  y -= 15;

  for (const skill of data.skills) {
    page.drawText(`•  ${skill}`, {
      x: 55,
      y,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }
  y -= 12;

  // Section: Work Experience
  page.drawText('WORK EXPERIENCE', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.35),
  });
  y -= 18;

  for (const exp of data.experience) {
    page.drawText(`${exp.role} - ${exp.company}`, {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(exp.period, {
      x: width - 150,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 14;

    for (const bullet of exp.bullets) {
      let bLine = '';
      const bWords = bullet.split(' ');
      let isFirst = true;

      for (const bw of bWords) {
        const testB = bLine ? `${bLine} ${bw}` : bw;
        if (testB.length > 82) {
          page.drawText(`${isFirst ? '–  ' : '   '}${bLine}`, {
            x: 55,
            y,
            size: 8.5,
            font,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 12;
          bLine = bw;
          isFirst = false;
        } else {
          bLine = testB;
        }
      }
      if (bLine) {
        page.drawText(`${isFirst ? '–  ' : '   '}${bLine}`, {
          x: 55,
          y,
          size: 8.5,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
        y -= 14;
      }
    }
    y -= 6;
  }

  // Section: Education
  page.drawText('EDUCATION', {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.35),
  });
  y -= 15;
  page.drawText(data.education, {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  await fs.writeFile(outputPath, pdfBytes);
}

async function main() {
  const targetDir = path.join(process.cwd(), 'sample_cvs');
  await fs.mkdir(targetDir, { recursive: true });

  // Clean old files in sample_cvs
  const existingFiles = await fs.readdir(targetDir);
  for (const f of existingFiles) {
    if (f.endsWith('.pdf')) {
      await fs.unlink(path.join(targetDir, f));
    }
  }

  console.log(`Generating 10 realistic PDF resumes in: ${targetDir}`);

  for (const resume of SAMPLE_RESUMES) {
    const filePath = path.join(targetDir, resume.fileName);
    await createPDF(resume, filePath);
    console.log(`✓ Generated: ${resume.fileName}`);
  }

  console.log('\n🎉 All 10 sample CV PDFs generated successfully!');
}

main().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
