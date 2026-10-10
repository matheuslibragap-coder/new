/** Reduz fotos grandes no navegador antes do envio (limite de 4 MB no servidor). */
export async function prepararImagem(arquivo: File): Promise<File> {
  const LIMITE = 3.5 * 1024 * 1024;
  const LADO_MAX = 2000;
  const bitmap = await createImageBitmap(arquivo).catch(() => null);
  if (!bitmap) return arquivo;
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && arquivo.size <= LIMITE) {
    bitmap.close();
    return arquivo;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) return arquivo;
  return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}
