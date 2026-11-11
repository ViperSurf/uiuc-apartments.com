/**
 * Semester windows for the availability filter.
 *
 * The filter used to default to a hard-coded Aug-Oct 2023 range,
 * which silently hid every current listing. Defaults are now
 * "any date", with one-tap presets for the current and upcoming
 * semesters, computed from today's date.
 *
 * UIUC terms (approximate, for filtering only):
 *  Spring: Jan 1 - May 31 · Summer: Jun 1 - Jul 31 · Fall: Aug 1 - Dec 31
 */
export interface SemesterPreset {
  label: string
  range: [Date, Date]
}

function termOf(d: Date): { name: string; start: Date; end: Date } {
  const y = d.getFullYear()
  const m = d.getMonth()
  if (m <= 4) return { name: 'Spring', start: new Date(y, 0, 1), end: new Date(y, 4, 31) }
  if (m <= 6) return { name: 'Summer', start: new Date(y, 5, 1), end: new Date(y, 6, 31) }
  return { name: 'Fall', start: new Date(y, 7, 1), end: new Date(y, 11, 31) }
}

function nextTerm(t: { start: Date; end: Date }): { name: string; start: Date; end: Date } {
  // The day after this term ends is inside the next term.
  const probe = new Date(t.end)
  probe.setDate(probe.getDate() + 1)
  return termOf(probe)
}

/** The next four semester windows starting with the current one. */
export function semesterPresets(today = new Date()): SemesterPreset[] {
  const out: SemesterPreset[] = []
  let t = termOf(today)
  for (let i = 0; i < 4; i++) {
    out.push({
      label: `${t.name} ${t.start.getFullYear()}`,
      range: [t.start, t.end],
    })
    t = nextTerm(t)
  }
  return out
}
