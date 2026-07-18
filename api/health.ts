// Smoke-test endpoint (deploy verification)
type Res = { status(code: number): { json(body: unknown): void } }

export default function handler(_req: unknown, res: Res) {
  res.status(200).json({
    ok: true,
    service: 'nycrhythm',
    phase: 'M0',
    time: new Date().toISOString(),
  })
}
