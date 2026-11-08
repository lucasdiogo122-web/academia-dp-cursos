import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  grantAccessAction,
  cancelAccessAction,
  toggleAdminAction,
} from "../actions";
import CreateUserForm from "./CreateUserForm";
import ForceResetButton from "./ForceResetButton";

function formatDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("pt-BR");
}

export default async function UsuariosPage() {
  const session = await auth();
  const [users, courses] = await Promise.all([
    prisma.user.findMany({
      include: { purchases: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const now = Date.now();

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand">Adicionar usuário</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Cria uma conta manualmente (ex.: cortesia, venda fora do site) e, se
        quiser, já libera o acesso a um curso.
      </p>
      <div className="mt-4">
        <CreateUserForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand">
        Usuários e perfis de acesso
      </h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-brand/5 text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Senha</th>
              {courses.map((c) => (
                <th key={c.id} className="px-4 py-3">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-foreground/90">{user.name}</div>
                  <div className="text-xs text-foreground/50">{user.email}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <form action={toggleAdminAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="makeAdmin"
                      value={(!user.isAdmin).toString()}
                    />
                    <button
                      type="submit"
                      disabled={user.id === session?.user.id}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.isAdmin
                          ? "bg-brand text-white hover:bg-brand-dark"
                          : "bg-black/5 text-foreground/60 hover:bg-black/10"
                      }`}
                      title={
                        user.id === session?.user.id
                          ? "Você não pode alterar sua própria permissão"
                          : undefined
                      }
                    >
                      {user.isAdmin ? "Admin" : "Aluno"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 align-top">
                  {user.mustChangePassword && (
                    <span className="mb-1 block text-xs text-yellow-700">
                      Aguardando 1º acesso
                    </span>
                  )}
                  <ForceResetButton userId={user.id} />
                </td>

                {courses.map((course) => {
                  const purchase = user.purchases.find((p) => p.courseId === course.id);
                  const expired =
                    purchase?.accessExpiresAt !== null &&
                    purchase?.accessExpiresAt !== undefined &&
                    purchase.accessExpiresAt.getTime() <= now;
                  const hasActiveAccess =
                    purchase?.status === "PAID" && !expired;

                  return (
                    <td key={course.id} className="px-4 py-3 align-top">
                      {hasActiveAccess ? (
                        <div className="space-y-1">
                          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-dark">
                            Ativo
                            {purchase?.accessExpiresAt
                              ? ` até ${formatDate(purchase.accessExpiresAt)}`
                              : " (vitalício)"}
                          </span>
                          <form action={cancelAccessAction}>
                            <input type="hidden" name="purchaseId" value={purchase!.id} />
                            <button
                              type="submit"
                              className="block text-xs font-medium text-red-600 hover:underline"
                            >
                              Cancelar inscrição
                            </button>
                          </form>
                        </div>
                      ) : (
                        <form action={grantAccessAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium text-brand hover:border-brand/40"
                          >
                            Conceder acesso
                          </button>
                        </form>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={3 + courses.length}
                  className="px-4 py-8 text-center text-foreground/50"
                >
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
