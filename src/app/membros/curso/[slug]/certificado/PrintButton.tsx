"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-md bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark"
    >
      Imprimir / salvar como PDF
    </button>
  );
}
