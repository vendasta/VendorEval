import fs from 'fs'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SCRIPT = `
Welcome to VendorEval AI — the intelligent vendor proposal evaluator.
Upload. Analyze. Decide. In 10 minutes.

Here is the problem. A procurement manager receives 6 vendor proposals in PDF format.
They spend two to three weeks reading every page, building comparison spreadsheets,
and still make decisions based on gut feel. Wrong vendor selected. Project overruns.
Company loses money.

VendorEval AI solves this completely.

Watch what happens. We click Try Demo and instantly see a live cloud infrastructure
vendor evaluation — two vendors have already been analyzed.

The dashboard shows immediately: CloudForce Systems wins with a score of 84 out of 100
and 87 percent confidence. The AI has already done the work.

We click the Comparison Matrix tab. Every metric is side by side — pricing, SLA commitments,
timeline, payment terms, support hours. CloudForce is 18 lakh cheaper than TechSolutions
and includes 24 by 7 support with no extra charges.

Now the Red Flags tab. The AI found 3 critical issues in TechSolutions proposal —
no liability for data loss during migration, a 90-day auto-renewal trap, and
a 15 percent annual price escalation clause buried in the fine print.
These are exactly the clauses a busy procurement manager would miss at 11pm.

Finally, we ask the AI directly — what should I negotiate with CloudForce?
The AI responds with 3 specific negotiation points backed by the proposal data.

The entire analysis: 10 minutes. Not 3 weeks.
This saves 40 hours of manual work per evaluation, eliminates hidden cost surprises,
and reduces wrong vendor selection by giving every decision-maker the same data.

VendorEval AI. Built for the BE10X AI Hackathon 2026.
`

const mp3 = await client.audio.speech.create({ model: 'tts-1-hd', voice: 'onyx', input: SCRIPT, speed: 0.95 })
const buffer = Buffer.from(await mp3.arrayBuffer())
fs.mkdirSync('../submission', { recursive: true })
fs.writeFileSync('../submission/voiceover.mp3', buffer)
console.log('Voiceover saved to submission/voiceover.mp3')
