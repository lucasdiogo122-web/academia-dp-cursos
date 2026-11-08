import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const BENEFITS = [
  {
    title: "Admissão sem erro",
    description:
      "Checklist completo de documentos, contrato de experiência e integração de novos colaboradores.",
  },
  {
    title: "Folha de pagamento na prática",
    description:
      "Cálculo de salário, horas extras, adicional noturno, DSR e descontos com exemplos reais.",
  },
  {
    title: "eSocial sem susto",
    description:
      "Quais eventos enviar, prazos e como evitar as multas mais comuns no dia a dia do DP.",
  },
  {
    title: "Férias e rescisão",
    description:
      "Cálculo de férias, aviso prévio, verbas rescisórias e homologação passo a passo.",
  },
  {
    title: "FGTS, INSS e encargos",
    description:
      "Entenda guias, competências e como conferir se os recolhimentos estão corretos.",
  },
  {
    title: "Modelos e planilhas",
    description:
      "Templates prontos para usar no seu dia a dia, sem precisar criar nada do zero.",
  },
];

const FAQ = [
  {
    q: "Por quanto tempo tenho acesso ao curso?",
    a: "O acesso é liberado automaticamente após a confirmação do pagamento e permanece disponível na sua área de membros.",
  },
  {
    q: "Como recebo acesso às aulas?",
    a: "Você cria sua conta no próprio checkout. Assim que o pagamento é aprovado pelo Mercado Pago, as aulas aparecem na sua área de membros.",
  },
  {
    q: "O curso é indicado para quem está começando no DP?",
    a: "Sim. O conteúdo foi estruturado do zero, com linguagem simples e exemplos práticos do dia a dia do setor.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Pix, boleto e cartão de crédito, processados com segurança pelo Mercado Pago.",
  },
];

export default async function HomePage() {
  // Preço e currículo podem mudar a qualquer momento: busca sempre a cada
  // request em vez de congelar os dados no HTML pré-renderizado.
  await connection();

  const course = await prisma.course.findFirst({
    where: { published: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalLessons =
    course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Curso online · Departamento Pessoal
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {course?.title ?? "Departamento Pessoal na Prática"}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {course?.description ??
                "Aprenda admissão, folha de pagamento, eSocial, férias e rescisão com aulas em vídeo direto ao ponto, feitas para o dia a dia do DP."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {course ? (
                <Link
                  href={`/checkout/${course.slug}`}
                  className="rounded-md bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent-dark"
                >
                  Quero começar agora — {formatPrice(course.priceCents)}
                </Link>
              ) : (
                <span className="rounded-md bg-white/10 px-6 py-3 text-sm text-white/70">
                  Nenhum curso publicado ainda. Rode{" "}
                  <code className="rounded bg-black/30 px-1">npm run db:seed</code>.
                </span>
              )}
              <a
                href="#curriculo"
                className="text-sm font-medium text-white/80 underline-offset-4 hover:underline"
              >
                Ver conteúdo do curso
              </a>
            </div>
            {course && (
              <p className="mt-4 text-sm text-white/60">
                {course.modules.length} módulos · {totalLessons} videoaulas · acesso
                imediato após o pagamento
              </p>
            )}
          </div>
          <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Para quem é este curso
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              <li>• Profissionais de RH que atuam ou querem atuar no DP</li>
              <li>• Empreendedores que fazem a folha da própria empresa</li>
              <li>• Estudantes e estagiários da área de recursos humanos</li>
              <li>• Quem busca uma recolocação no mercado de trabalho</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-brand sm:text-3xl">
          O que você vai dominar
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-lg border border-black/5 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-brand">{b.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Currículo */}
      {course && course.modules.length > 0 && (
        <section id="curriculo" className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-brand sm:text-3xl">
              Conteúdo do curso
            </h2>
            <div className="mt-10 space-y-4">
              {course.modules.map((mod, i) => (
                <div
                  key={mod.id}
                  className="overflow-hidden rounded-lg border border-black/10"
                >
                  <div className="flex items-center justify-between bg-brand/5 px-5 py-3">
                    <h3 className="font-semibold text-brand">
                      Módulo {i + 1}: {mod.title}
                    </h3>
                    <span className="text-xs text-foreground/50">
                      {mod.lessons.length} aulas
                    </span>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 px-5 py-3 text-sm text-foreground/80"
                      >
                        <span className="text-accent">▶</span>
                        {lesson.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Preço / CTA */}
      {course && (
        <section id="curso" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-accent/30 bg-white p-8 text-center shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Acesso completo
            </p>
            <p className="mt-2 text-4xl font-bold text-brand">
              {formatPrice(course.priceCents)}
            </p>
            <p className="mt-1 text-sm text-foreground/60">
              Pagamento único via Pix, boleto ou cartão
            </p>
            <Link
              href={`/checkout/${course.slug}`}
              className="mt-6 inline-block w-full rounded-md bg-accent px-6 py-3 font-semibold text-white shadow-md hover:bg-accent-dark sm:w-auto"
            >
              Garantir minha vaga
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-brand sm:text-3xl">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="rounded-lg border border-black/10 p-4 open:bg-brand/5"
              >
                <summary className="cursor-pointer font-medium text-brand">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-foreground/70">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
