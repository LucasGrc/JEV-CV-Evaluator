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
  {
    fileName: 'Alexander_Wright_Senior_FullStack.pdf',
    fullName: 'Alexander Wright',
    title: 'Senior Full-Stack Engineer',
    email: 'alex.wright.dev@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    summary:
      'Senior Full-Stack Engineer with 8+ years of experience building high-scale web platforms using Next.js, React, TypeScript, and Node.js. Proven track record leading squads, reducing Core Web Vitals LCP by 45%, and architecting mission-critical microservices with PostgreSQL, Redis, and Docker on AWS.',
    skills: [
      'Next.js 14 (App Router, Server Components)',
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
  {
    fileName: 'Elena_Rostova_Staff_Cloud_DevOps.pdf',
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
  {
    fileName: 'David_Chen_Principal_Backend_Architect.pdf',
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
    ],
    education: 'B.S. in Computer Science - University of Texas at Austin (2014)',
  },
  {
    fileName: 'Lucas_Miller_Junior_Frontend.pdf',
    fullName: 'Lucas Miller',
    title: 'Junior Front-End Developer',
    email: 'lucas.miller.jr@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Denver, CO',
    summary:
      'Junior Front-End Developer with 1 year of experience building responsive websites with HTML, CSS, JavaScript, and introductory React. Seeking an entry-level position to continue learning modern full-stack development, backend APIs, and cloud deployments under senior mentorship.',
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
  {
    fileName: 'Carlos_Gomez_FullStack_Espanol.pdf',
    fullName: 'Carlos Gómez Martínez',
    title: 'Desarrollador Full-Stack Senior',
    email: 'carlos.gomez@ejemplo.es',
    phone: '+34 612 345 678',
    location: 'Madrid, España',
    summary:
      'Ingeniero de Software Senior con más de 7 años de experiencia desarrollando aplicaciones web empresariales. Especializado en JavaScript, TypeScript, React y Node.js con bases de datos relacionales PostgreSQL y despliegues con contenedores Docker. Liderazgo de equipos técnicos multidisciplinarios.',
    skills: [
      'Desarrollo Front-End con React, Next.js y TypeScript',
      'Arquitectura Back-End con Node.js, Express y microservicios',
      'Bases de datos relacionales PostgreSQL, MySQL y Prisma ORM',
      'Contenedores Docker, integración continua CI/CD y despliegues en la nube',
    ],
    experience: [
      {
        role: 'Líder Técnico de Desarrollo',
        company: 'Soluciones Digitales Ibéricas',
        period: '2020 - Actualidad',
        bullets: [
          'Lideró el equipo de ingeniería en la migración de plataformas hacia microservicios en la nube.',
          'Diseño y optimización de esquemas de bases de datos relacionales en PostgreSQL.',
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

  console.log(`Generating 5 realistic PDF resumes in: ${targetDir}`);

  for (const resume of SAMPLE_RESUMES) {
    const filePath = path.join(targetDir, resume.fileName);
    await createPDF(resume, filePath);
    console.log(`✓ Generated: ${resume.fileName}`);
  }

  console.log('\nAll sample CV PDFs generated successfully!');
}

main().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
