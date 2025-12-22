import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export type ClockFallbackPayload = {
  locationId: number;
  iat?: number;
  exp?: number;
};

export function signClockFallbackToken(locationId: number) {
  const ttl = Number(process.env.CLOCK_FALLBACK_TTL_SECONDS || 120);

  return jwt.sign({ locationId }, JWT_SECRET, {
    expiresIn: ttl,
  });
}

export function verifyClockFallbackToken(token: string): ClockFallbackPayload {
  return jwt.verify(token, JWT_SECRET) as ClockFallbackPayload;
}
