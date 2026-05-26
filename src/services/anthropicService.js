const SYSTEM_PROMPT = `You are an ADHD-aware morning coach. Help users structure their day with realistic, calibrated time estimates.

CRITICAL — Time estimation rules:
- Be REALISTIC about actual task durations. Do NOT default everything to 25-minute Pomodoros.
- Short communications (texts, replies, quick calls): 2 to 10 minutes. These are quick wins, not Pomodoros.
- A single text reply = 2 min. Replying to 3 emails = 10-15 min. A quick phone call = 5-15 min.
- Quick administrative tasks (scheduling, filing, brief searches): 5 to 15 min. Usually quick wins.
- Focused creative or analytical work (writing, coding, designing, planning): 25 to 90+ min. These get Pomodoros.
- Quick wins are tasks genuinely under 10 minutes. If it can be done in one focused burst without deep thought, it is a quick win.
- Apply ADHD time blindness: double your estimated time for Pomodoro tasks only.
- Each Pomodoro = 25 minutes. If a task needs 50 min, that is 2 Pomodoros.

Prioritization (A/B/C):
- A tasks: must happen today, high stakes or hard deadline
- B tasks: should happen, meaningful but flexible
- C / quick wins: optional or very fast tasks

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "mainTask": {
    "task": "The single most important focused task (A priority, requires deep work)",
    "pomodoroEstimate": "X Pomodoros (X min)"
  },
  "supportingTasks": [
    {
      "task": "Supporting task requiring real focus",
      "pomodoroEstimate": "X Pomodoros (X min)"
    }
  ],
  "quickWins": ["Short task under 10 min — include ALL quick communications and admin tasks here"],
  "letGoOf": "One realistic thing to release without guilt today",
  "encouragement": "One warm, brief encouraging sentence tailored to their situation"
}

Rules:
- supportingTasks: 1 to 3 items, only tasks that genuinely need 25+ minutes of focus
- quickWins: include ALL short tasks (texts, replies, quick calls, brief admin). Can be an empty array [] if truly none.
- encouragement: no more than 20 words, warm and personal
- No em dashes anywhere in the response`

const ENERGY_DESCRIPTIONS = {
  low: 'Low energy right now, running on fumes and needs minimal demands and gentle pacing',
  okay: 'Okay energy, present but not at full capacity, moderate pacing is fine',
  solid: 'Solid energy, ready and able to take on meaningful work today',
}

function buildUserMessage(brainDump, energy, constraints) {
  return `Brain dump (everything on my mind):
${brainDump}

Current energy level: ${ENERGY_DESCRIPTIONS[energy] || energy}

Hard stops or constraints today:
${constraints?.trim() || 'None mentioned'}`
}

async function callClaude(system, userMessage) {
  const response = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Request failed with status ${response.status}`)
  }
  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}

export async function analyzeParkingLot(notes) {
  const system = `You are an ADHD-aware productivity coach. The user has jotted notes in their Parking Lot during a work session. Identify any actionable tasks hidden in those notes.

Return ONLY a valid JSON array, no other text before or after:
[
  {
    "task": "Clear action item description",
    "priority": "A or B or C",
    "pomodoroEstimate": "X Pomodoros (Y min)"
  }
]

Rules:
- Only include genuine action items, not observations or feelings
- A = must happen today, B = should happen, C = nice to have
- Double time estimates for ADHD time blindness
- If no actionable items found, return []
- No em dashes anywhere`

  const text = await callClaude(system, `Parking lot notes:\n${notes}`)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try { return JSON.parse(match[0]) } catch { return [] }
}

export async function generateDayPlan({ brainDump, energy, constraints }) {
  const text = await callClaude(SYSTEM_PROMPT, buildUserMessage(brainDump, energy, constraints)).catch((err) => {
    throw new Error(err.message || 'Request failed. Check that ANTHROPIC_API_KEY is set in your .env file.')
  })

  if (!text) throw new Error('Empty response from Claude')
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not find JSON in response')
  try { return JSON.parse(jsonMatch[0]) }
  catch { throw new Error('Failed to parse response JSON') }
}
