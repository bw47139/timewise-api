import CryptoJS from "crypto-js";

const SECRET = process.env.FACE_SECRET!;

/**
 * Encrypt face embedding before saving
 */
export function encryptEmbedding(vector: number[]): string {
  return CryptoJS.AES.encrypt(
    JSON.stringify(vector),
    SECRET
  ).toString();
}

/**
 * Decrypt face embedding from DB
 */
export function decryptEmbedding(encrypted: string): number[] {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

/**
 * Euclidean distance comparison
 */
export function calculateDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}
