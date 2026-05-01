import { mkdir, writeFile } from "fs/promises";
import path from "path";

export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

export function getMaxPdfSizeBytes() {
  const mb = Number(process.env.MAX_PDF_SIZE_MB || "20");
  return mb * 1024 * 1024;
}

export async function saveCallSheet(studioId: string, shiftId: string, file: File) {
  if (!file || file.size === 0) return null;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Можно загружать только PDF.");
  if (file.size > getMaxPdfSizeBytes()) throw new Error("PDF превышает допустимый размер.");

  const relativePath = path.join("studios", studioId, "call-sheets", `${shiftId}.pdf`);
  const absolutePath = path.join(getUploadRoot(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return relativePath;
}

export function resolveUploadPath(relativePath: string) {
  const root = getUploadRoot();
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error("Недопустимый путь файла.");
  return absolutePath;
}
