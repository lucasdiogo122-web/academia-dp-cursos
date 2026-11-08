import { getAllEnrollments, computeAdminStats } from "@/lib/admin";
import { cancelAccessAction } from "./actions";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-accent/10 text-accent-dark",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  REJECTED: "Recusado",
  REFUNDED: "Reembolsado",
};

export default async function AdminPage() {
  const rows = await getAllEnrollments();
  const stats = computeAdminStats(rows);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Alunos pagantes" value={stats.totalStudents.toString()} />
        <StatCard label="Acessos ativos" value={stats.activeAccess.toString()} />
        <StatCard label="Acessos expirados" value={stats.expiredAccess.toString()} />
        <StatCard label="Pagamentos pendentes" value={stats.pending.toString()} />
        <StatCard label="Receita confirmada" value={formatPrice(stats.revenueCents)} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand">Todas as inscrições</h2>
        <a
          href="/api/admin/export"
          className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-brand hover:border-brand/40"
        >
          Exportar CSV
        </a>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-brand/5 text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Comprado em</th>
              <th className="px-4 py-3">Acesso expira em</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground/90">{row.studentName}</div>
                  <div className="text-xs text-foreground/50">{row.studentEmail}</div>
                </td>
                <td className="px-4 py-3 text-foreground/80">{row.courseTitle}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[row.status]}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground/80">
                  {formatPrice(row.amountCents)}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {formatDate(row.purchasedAt)}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {row.accessExpiresAt ? formatDate(row.accessExpiresAt) : "Vitalício"}
                </td>
                <td className="px-4 py-3">
                  {row.status === "PAID" ? (
                    <span
                      className={
                        row.isActive
                          ? "text-accent-dark font-medium"
                          : "font-medium text-red-600"
                      }
                    >
                      {row.isActive ? "Ativo" : "Expirado"}
                    </span>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.status === "PAID" && row.isActive && (
                    <form action={cancelAccessAction}>
                      <input type="hidden" name="purchaseId" value={row.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Cancelar inscrição
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-foreground/50">
                  Nenhuma inscrição ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-brand">{value}</p>
    </div>
  );
}
