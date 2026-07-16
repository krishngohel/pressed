// Expands %%SECTION%% markers in a .tex template into repeated blocks with
// indexed {{{KEY}}} placeholders, and builds the flat placeholders map.
// The stored latex_source keeps its markers; values live in `placeholders`,
// so WYSIWYG edits only ever touch the map. Users never see this source.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(__dirname, '../src/templates')
export const TEMPLATES = ['classic', 'modern', 'academic', 'minimal']

export function loadTemplate(name) {
  const safe = TEMPLATES.includes(name) ? name : 'classic'
  return fs.readFileSync(path.join(TEMPLATE_DIR, `${safe}.tex`), 'utf8')
}

const P = (key) => `{{{${key}}}}`

function experienceBlock(jobs) {
  if (!jobs?.length) return ''
  const items = jobs
    .map((job, i) => {
      const bullets = (job.bullets || [])
        .map((_, j) => `        \\resumeItem{${P(`JOB_${i}_BULLET_${j}`)}}`)
        .join('\n')
      return [
        `    \\resumeSubheading`,
        `      {${P(`JOB_${i}_TITLE`)}}{${P(`JOB_${i}_DATES`)}}`,
        `      {${P(`JOB_${i}_COMPANY`)}}{${P(`JOB_${i}_LOCATION`)}}`,
        bullets ? `      \\resumeItemListStart\n${bullets}\n      \\resumeItemListEnd` : '',
      ].filter(Boolean).join('\n')
    })
    .join('\n')
  return `\\section{Experience}\n  \\resumeSubHeadingListStart\n${items}\n  \\resumeSubHeadingListEnd`
}

function educationBlock(items) {
  if (!items?.length) return ''
  const rows = items
    .map((edu, i) => {
      const bullets = (edu.bullets || [])
        .map((_, j) => `        \\resumeItem{${P(`EDU_${i}_HIGHLIGHT_${j}`)}}`)
        .join('\n')
      return [
        `    \\resumeSubheading`,
        `      {${P(`EDU_${i}_SCHOOL`)}}{${P(`EDU_${i}_LOCATION`)}}`,
        `      {${P(`EDU_${i}_DEGREE`)}}{${P(`EDU_${i}_DATES`)}}`,
        bullets ? `      \\resumeItemListStart\n${bullets}\n      \\resumeItemListEnd` : '',
      ].filter(Boolean).join('\n')
    })
    .join('\n')
  return `\\section{Education}\n  \\resumeSubHeadingListStart\n${rows}\n  \\resumeSubHeadingListEnd`
}

function projectsBlock(items) {
  if (!items?.length) return ''
  const rows = items
    .map((proj, i) => {
      const bullets = (proj.bullets || [])
        .map((_, j) => `        \\resumeItem{${P(`PROJECT_${i}_BULLET_${j}`)}}`)
        .join('\n')
      return [
        `    \\resumeProjectHeading`,
        `      {\\textbf{${P(`PROJECT_${i}_TITLE`)}} $|$ \\emph{${P(`PROJECT_${i}_TECH`)}}}{${P(`PROJECT_${i}_DATES`)}}`,
        bullets ? `      \\resumeItemListStart\n${bullets}\n      \\resumeItemListEnd` : '',
      ].filter(Boolean).join('\n')
    })
    .join('\n')
  return `\\section{Projects}\n  \\resumeSubHeadingListStart\n${rows}\n  \\resumeSubHeadingListEnd`
}

function skillsBlock(groups) {
  if (!groups?.length) return ''
  const rows = groups
    .map((_, i) => `     \\textbf{${P(`SKILL_GROUP_${i}_NAME`)}}{: ${P(`SKILL_GROUP_${i}_ITEMS`)}} \\\\`)
    .join('\n')
  return `\\section{Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n${rows}\n    }}\n \\end{itemize}`
}

function simpleListBlock(sectionTitle, keyPrefix, items) {
  if (!items?.length) return ''
  const rows = items
    .map((_, i) => `    \\resumeItem{\\textbf{${P(`${keyPrefix}_${i}_TITLE`)}} — ${P(`${keyPrefix}_${i}_DETAIL`)}}`)
    .join('\n')
  return `\\section{${sectionTitle}}\n  \\begin{itemize}[leftmargin=0.15in]\n${rows}\n  \\end{itemize}`
}

const summaryBlock = (summary) =>
  summary ? `\\section{Summary}\n  \\small{${P('SUMMARY')}}` : ''

// data: { contact, summary, experiences, education, skills, projects, certifications, awards, publications }
export function buildResume(templateName, data) {
  let source = loadTemplate(templateName)
  const placeholders = {}

  const contact = data.contact || {}
  placeholders.CONTACT_NAME = contact.name || 'Your Name'
  placeholders.CONTACT_EMAIL = contact.email || ''
  placeholders.CONTACT_PHONE = contact.phone || ''
  placeholders.CONTACT_LINKEDIN = contact.linkedin || contact.website || ''
  placeholders.CONTACT_LOCATION = contact.location || ''
  if (data.summary) placeholders.SUMMARY = data.summary

  ;(data.experiences || []).forEach((job, i) => {
    placeholders[`JOB_${i}_TITLE`] = job.title || ''
    placeholders[`JOB_${i}_COMPANY`] = job.company || ''
    placeholders[`JOB_${i}_LOCATION`] = job.location || ''
    placeholders[`JOB_${i}_DATES`] = job.dates || ''
    ;(job.bullets || []).forEach((b, j) => { placeholders[`JOB_${i}_BULLET_${j}`] = b })
  })

  ;(data.education || []).forEach((edu, i) => {
    placeholders[`EDU_${i}_SCHOOL`] = edu.school || ''
    placeholders[`EDU_${i}_DEGREE`] = edu.degree || ''
    placeholders[`EDU_${i}_LOCATION`] = edu.location || ''
    placeholders[`EDU_${i}_DATES`] = edu.dates || ''
    ;(edu.bullets || []).forEach((b, j) => { placeholders[`EDU_${i}_HIGHLIGHT_${j}`] = b })
  })

  ;(data.projects || []).forEach((proj, i) => {
    placeholders[`PROJECT_${i}_TITLE`] = proj.title || ''
    placeholders[`PROJECT_${i}_TECH`] = proj.tech || ''
    placeholders[`PROJECT_${i}_DATES`] = proj.dates || ''
    ;(proj.bullets || []).forEach((b, j) => { placeholders[`PROJECT_${i}_BULLET_${j}`] = b })
  })

  ;(data.skills || []).forEach((group, i) => {
    placeholders[`SKILL_GROUP_${i}_NAME`] = group.group || 'Skills'
    placeholders[`SKILL_GROUP_${i}_ITEMS`] = (group.items || []).join(', ')
  })

  ;(data.certifications || []).forEach((c, i) => {
    placeholders[`CERT_${i}_TITLE`] = c.title || ''
    placeholders[`CERT_${i}_DETAIL`] = [c.issuer, c.date].filter(Boolean).join(', ')
  })
  ;(data.awards || []).forEach((a, i) => {
    placeholders[`AWARD_${i}_TITLE`] = a.title || ''
    placeholders[`AWARD_${i}_DETAIL`] = [a.issuer, a.date].filter(Boolean).join(', ')
  })
  ;(data.publications || []).forEach((p, i) => {
    placeholders[`PUB_${i}_TITLE`] = p.title || ''
    placeholders[`PUB_${i}_DETAIL`] = [p.venue, p.date].filter(Boolean).join(', ')
  })

  source = source
    .replace('%%SUMMARY%%', summaryBlock(data.summary))
    .replace('%%EXPERIENCE%%', experienceBlock(data.experiences))
    .replace('%%EDUCATION%%', educationBlock(data.education))
    .replace('%%PROJECTS%%', projectsBlock(data.projects))
    .replace('%%SKILLS%%', skillsBlock(data.skills))
    .replace('%%CERTIFICATIONS%%', simpleListBlock('Certifications', 'CERT', data.certifications))
    .replace('%%AWARDS%%', simpleListBlock('Awards \\& Honors', 'AWARD', data.awards))
    .replace('%%PUBLICATIONS%%', simpleListBlock('Publications', 'PUB', data.publications))

  return { latex_source: source, placeholders }
}

// Deterministic fallback: shape vault entries → resume data without AI.
export function vaultToResumeData(grouped) {
  const contactEntry = (grouped.contact || [])[0] || {}
  const meta = contactEntry.meta || {}
  const dates = (e) => [e.start_date, e.current ? 'Present' : e.end_date].filter(Boolean).join(' -- ')

  const skillGroups = {}
  for (const s of grouped.skills || []) {
    const g = s.meta?.group || 'Technical'
    ;(skillGroups[g] = skillGroups[g] || []).push(s.title)
  }

  return {
    contact: {
      name: contactEntry.title || '',
      email: meta.email || '',
      phone: meta.phone || '',
      linkedin: meta.linkedin || meta.website || '',
      location: contactEntry.location || '',
    },
    summary: (grouped.summary || [])[0]?.description || null,
    experiences: (grouped.experience || []).map((e) => ({
      title: e.title, company: e.organization, location: e.location, dates: dates(e), bullets: e.bullets || [],
    })),
    education: (grouped.education || []).map((e) => ({
      school: e.organization,
      degree: [e.title, e.meta?.field].filter(Boolean).join(' in '),
      location: e.location, dates: dates(e), bullets: e.bullets || [],
    })),
    projects: (grouped.projects || []).map((p) => ({
      title: p.title, tech: p.meta?.tech || '', dates: dates(p), bullets: p.bullets || [],
    })),
    skills: Object.entries(skillGroups).map(([group, items]) => ({ group, items })),
    certifications: (grouped.certifications || []).map((c) => ({ title: c.title, issuer: c.organization, date: c.start_date })),
    awards: (grouped.awards || []).map((a) => ({ title: a.title, issuer: a.organization, date: a.start_date })),
    publications: (grouped.publications || []).map((p) => ({ title: p.title, venue: p.organization, date: p.start_date })),
  }
}
