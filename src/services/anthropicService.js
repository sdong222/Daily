const SYSTEM_PROMPT = `You are an ADHD-aware morning coach. Help users structure their day using evidence-based strategies.

Your approach:
- Use CBT-based A/B/C prioritization: A tasks must happen today, B tasks should happen, C tasks are optional
- Double all time estimates to account for ADHD time blindness (each Pomodoro = 25 minutes)
- Keep language warm, direct, and non-shaming
- Never overwhelm: maximum 1 main task and 3 supporting tasks total
- Quick wins are tasks under 5 minutes that the user explicitly mentioned
- The "let go" item should acknowledge real limitations with genuine compassion
- Never use em dashes anywhere in your response

Return ONLY a valid JSON object with this exact structure, no other text before or after:
{
  "mainTask": {
    "task": "The single most important task for today (A priority)",
    "pomodoroEstimate": "X Pomodoros (X min)"
  },
  "supportingTasks": [
    {
      "task": "Supporting task description",
      "pomodoroEstimate": "X Pomodoros (X min)"
    }
  ],
  "quickWins": ["Quick task under 5 minutes"],
  "letGoOf": "One realistic thing to release without guilt today",
  "encouragement": "One warm, brief encouraging sentence tailored to their energy and situation"
}

Rules:
- supportingTasks: 2 to 3 items maximum
- quickWins: empty array [] if no sub-5-minute tasks were mentioned by the user
- All Pomodoro estimates are doubled from the intuitive guess (e.g., "feels like 1 Pomodoro" becomes "2 Pomodoros (50 min)")
- encouragement: short and personal, no more than 20 words
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

export async function generateDayPlan({ brainDump, energy, constraints }) {
  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserMessage(brainDump, energy, constraints),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error?.message ||
        `Request failed with status ${response.status}. Check that ANTHROPIC_API_KEY is set in your .env file.`
    )
  }

  const data = await response.json()
  const text = data.content?.[0]?.text

  if (!text) {
    throw new Error('Empty response from Claude')
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not find JSON in response')
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Failed to parse response JSON')
  }
}
