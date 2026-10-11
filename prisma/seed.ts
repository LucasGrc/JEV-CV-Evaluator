import { PrismaClient, Role, VacancyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Create or update Default Admin Recruiter
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'Lead Recruiter',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log('Created Admin User:', adminUser.email);

  // 2. Create Initial Vacancy 1: Full-Stack Engineer
  const vacancy1 = await prisma.vacancy.upsert({
    where: { id: 'vac_fullstack_2026' },
    update: {},
    create: {
      id: 'vac_fullstack_2026',
      title: 'Senior Full-Stack Engineer (Next.js & TypeScript)',
      department: 'Engineering',
      description:
        'Seeking an experienced engineer with deep expertise in Next.js App Router, React Server Components, TypeScript, and scalable Node.js microservices. Experience with PostgreSQL and Docker is essential.',
      status: VacancyStatus.ACTIVE,
      minScoreThreshold: 2.5,
      weightSkills: 0.40,
      weightExperience: 0.35,
      weightEducation: 0.15,
      weightLeadership: 0.10,
      authorId: adminUser.id,
    },
  });
  console.log('Created Vacancy:', vacancy1.title);

  // 3. Create Initial Vacancy 2: DevOps & Cloud Specialist
  const vacancy2 = await prisma.vacancy.upsert({
    where: { id: 'vac_devops_2026' },
    update: {},
    create: {
      id: 'vac_devops_2026',
      title: 'Cloud & Platform Engineer (Kubernetes & CI/CD)',
      department: 'DevOps & Cloud',
      description:
        'Looking for a platform engineer to design and operate multi-cluster Kubernetes on AWS/GCP, manage Terraform IaC, and maintain robust GitHub Actions deployment pipelines.',
      status: VacancyStatus.ACTIVE,
      minScoreThreshold: 2.8,
      weightSkills: 0.30,
      weightExperience: 0.40,
      weightEducation: 0.15,
      weightLeadership: 0.15,
      authorId: adminUser.id,
    },
  });
  console.log('Created Vacancy:', vacancy2.title);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
