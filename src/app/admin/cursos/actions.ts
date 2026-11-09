"use server";

import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Acesso negado.");
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CourseFormState = { error?: string } | undefined;

/** Cria ou atualiza um curso (se `id` vier no formData, atualiza). */
export async function upsertCourseAction(
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const priceReais = formData.get("priceReais")?.toString().replace(",", ".");
  const accessDurationDaysRaw = formData.get("accessDurationDays")?.toString().trim();
  const published = formData.get("published") === "on";

  if (!title || !description || !priceReais) {
    return { error: "Preencha título, descrição e preço." };
  }
  const priceCents = Math.round(parseFloat(priceReais) * 100);
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return { error: "Preço inválido." };
  }
  const accessDurationDays = accessDurationDaysRaw
    ? parseInt(accessDurationDaysRaw, 10)
    : null;

  const data = {
    title,
    description,
    priceCents,
    accessDurationDays,
    published,
  };

  let courseId = id;
  if (id) {
    await prisma.course.update({ where: { id }, data });
  } else {
    const slug = slugify(title) || `curso-${Date.now()}`;
    const existing = await prisma.course.findUnique({ where: { slug } });
    const course = await prisma.course.create({
      data: { ...data, slug: existing ? `${slug}-${Date.now()}` : slug },
    });
    courseId = course.id;
  }

  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath("/");
  if (!id) {
    redirect(`/admin/cursos/${courseId}`);
  }
}

export async function deleteCourseAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}

export type ModuleFormState = { error?: string } | undefined;

export async function upsertModuleAction(
  _prevState: ModuleFormState,
  formData: FormData
): Promise<ModuleFormState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const courseId = formData.get("courseId")?.toString();
  const title = formData.get("title")?.toString().trim();
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);

  if (!courseId || !title) {
    return { error: "Preencha o título do módulo." };
  }

  if (id) {
    await prisma.module.update({ where: { id }, data: { title, order } });
  } else {
    await prisma.module.create({ data: { title, order, courseId } });
  }

  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteModuleAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const courseId = formData.get("courseId")?.toString();
  if (!id) return;
  await prisma.module.delete({ where: { id } });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export type LessonFormState = { error?: string } | undefined;

export async function upsertLessonAction(
  _prevState: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const moduleId = formData.get("moduleId")?.toString();
  const courseId = formData.get("courseId")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const pandaVideoId = formData.get("pandaVideoId")?.toString().trim();
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);

  if (!moduleId || !title || !pandaVideoId) {
    return { error: "Preencha título e ID do vídeo no Panda Video." };
  }

  if (id) {
    await prisma.lesson.update({
      where: { id },
      data: { title, description, pandaVideoId, order },
    });
  } else {
    await prisma.lesson.create({
      data: { title, description, pandaVideoId, order, moduleId },
    });
  }

  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteLessonAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const courseId = formData.get("courseId")?.toString();
  if (!id) return;

  const files = await prisma.lessonFile.findMany({ where: { lessonId: id } });
  await Promise.all(files.map((f) => del(f.url).catch(() => undefined)));

  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export type UploadFileState = { error?: string; success?: string } | undefined;

export async function uploadLessonFileAction(
  _prevState: UploadFileState,
  formData: FormData
): Promise<UploadFileState> {
  await requireAdmin();

  const lessonId = formData.get("lessonId")?.toString();
  const courseId = formData.get("courseId")?.toString();
  const file = formData.get("file") as File | null;

  if (!lessonId || !file || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Arquivo muito grande (máximo 10MB)." };
  }

  const blob = await put(`materiais/${lessonId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.lessonFile.create({
    data: {
      lessonId,
      name: file.name,
      url: blob.url,
      sizeBytes: file.size,
    },
  });

  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: `Arquivo "${file.name}" enviado.` };
}

export async function deleteLessonFileAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const courseId = formData.get("courseId")?.toString();
  if (!id) return;

  const file = await prisma.lessonFile.findUnique({ where: { id } });
  if (file) {
    await del(file.url).catch(() => undefined);
    await prisma.lessonFile.delete({ where: { id } });
  }
  revalidatePath(`/admin/cursos/${courseId}`);
}
