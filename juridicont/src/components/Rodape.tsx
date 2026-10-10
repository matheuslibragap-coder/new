import Link from "next/link";

export function Rodape() {
  return (
    <footer className="mt-auto border-t border-stone-200 px-4 py-6 text-center text-xs text-stone-500">
      <p className="mb-2">O Juridicont não tem vínculo com a OAB. As análises não constituem parecer jurídico.</p>
      <p className="space-x-4">
        <Link href="/termos" className="hover:underline">Termos de uso</Link>
        <Link href="/privacidade" className="hover:underline">Política de privacidade</Link>
      </p>
    </footer>
  );
}
