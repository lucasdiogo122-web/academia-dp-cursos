import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurado.");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// Troque "SEU_ID_DE_VIDEO_AQUI" pelo ID real de cada vídeo no Panda Video
// (visível na própria biblioteca de vídeos do seu painel Panda Video).
const CURRICULUM = [
  {
    title: "Admissão de colaboradores",
    lessons: [
      { title: "Documentos obrigatórios na admissão", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Contrato de experiência x contrato por prazo indeterminado", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Integração e primeiros dias do colaborador", videoId: "SEU_ID_DE_VIDEO_AQUI" },
    ],
  },
  {
    title: "Folha de pagamento",
    lessons: [
      { title: "Estrutura da folha de pagamento", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Horas extras, DSR e adicional noturno", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Descontos obrigatórios e benefícios", videoId: "SEU_ID_DE_VIDEO_AQUI" },
    ],
  },
  {
    title: "eSocial no dia a dia",
    lessons: [
      { title: "Visão geral dos eventos do eSocial", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Prazos e como evitar multas", videoId: "SEU_ID_DE_VIDEO_AQUI" },
    ],
  },
  {
    title: "Férias e rescisão",
    lessons: [
      { title: "Cálculo de férias passo a passo", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Aviso prévio e verbas rescisórias", videoId: "SEU_ID_DE_VIDEO_AQUI" },
      { title: "Homologação da rescisão", videoId: "SEU_ID_DE_VIDEO_AQUI" },
    ],
  },
];

async function main() {
  const course = await prisma.course.upsert({
    where: { slug: "departamento-pessoal-na-pratica" },
    update: {},
    create: {
      slug: "departamento-pessoal-na-pratica",
      title: "Departamento Pessoal na Prática",
      description:
        "Curso completo para dominar admissão, folha de pagamento, eSocial, férias e rescisão com aulas diretas ao ponto.",
      priceCents: 29700,
      published: true,
      accessDurationDays: 365,
    },
  });

  const existingModules = await prisma.module.count({ where: { courseId: course.id } });
  if (existingModules > 0) {
    console.log("Curso já tem módulos cadastrados — pulando criação de conteúdo.");
  } else {
  for (let i = 0; i < CURRICULUM.length; i++) {
    const modData = CURRICULUM[i];
    const mod = await prisma.module.create({
      data: { title: modData.title, order: i, courseId: course.id },
    });

    for (let j = 0; j < modData.lessons.length; j++) {
      const lessonData = modData.lessons[j];
      await prisma.lesson.create({
        data: {
          title: lessonData.title,
          order: j,
          pandaVideoId: lessonData.videoId,
          moduleId: mod.id,
        },
      });
    }
  }
  }

  const demoPasswordHash = await bcrypt.hash("senha12345", 10);
  await prisma.user.upsert({
    where: { email: "aluno.teste@example.com" },
    update: {},
    create: {
      name: "Aluno Teste",
      email: "aluno.teste@example.com",
      passwordHash: demoPasswordHash,
    },
  });

  console.log("Seed concluído:");
  console.log(`- Curso: ${course.title} (/checkout/${course.slug})`);
  console.log("- Login de teste: aluno.teste@example.com / senha12345");
  console.log(
    "  (crie uma Purchase com status PAID para esse usuário no Prisma Studio para testar a área de membros sem pagar)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
