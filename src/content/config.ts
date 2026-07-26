import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse } from 'yaml';

// Singleton YAML files are loaded whole (wrapped in a single "data" entry)
// so each file can keep its own natural top-level shape instead of being
// forced into a bare array.
function singleFile(path: string) {
  return file(path, {
    parser: (text: string) => [{ id: 'data', ...(parse(text) as Record<string, unknown>) }],
  });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const personal = defineCollection({
  loader: singleFile('src/content/profile/personal.yaml'),
  schema: z.object({
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    email: z.object({
      institutional: z.string(),
      personal: z.string(),
    }),
    phone: z.string().nullable(),
    location: z.object({
      city: z.string(),
      state: z.string(),
      country: z.string(),
      timezone: z.string(),
    }),
    socials: z.object({
      github: z.string(),
      linkedin: z.string(),
      orcid: z.string(),
      googleScholar: z.string(),
      researchGate: z.string(),
    }),
    website: z.string(),
    summary: z.string(),
    profile: z.array(z.string()),
  }),
});

const education = defineCollection({
  loader: singleFile('src/content/profile/education.yaml'),
  schema: z.object({
    degrees: z.array(
      z.object({
        id: z.string(),
        level: z.string(),
        field: z.string(),
        institution: z.string(),
        location: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        current: z.boolean(),
        advisor: z.string().optional(),
        status: z.string().optional(),
        description: z.string(),
      })
    ),
  }),
});

const certifications = defineCollection({
  loader: singleFile('src/content/profile/certifications.yaml'),
  schema: z.object({
    certifications: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        issuer: z.string(),
        issueDate: z.string(),
        expiryDate: z.string().nullable(),
        credentialId: z.string(),
        credentialUrl: z.string(),
        description: z.string(),
      })
    ),
  }),
});

const interests = defineCollection({
  loader: singleFile('src/content/profile/interests.yaml'),
  schema: z.object({
    researchInterests: z.array(z.string()),
    technicalSkills: z.record(z.string(), z.array(z.string())),
  }),
});

const awardsHonors = defineCollection({
  loader: singleFile('src/content/profile/awards-honors.yaml'),
  schema: z.object({
    awards: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        issuer: z.string(),
        year: z.number().nullable(),
        type: z.string(),
        description: z.string(),
        amount: z.union([z.string(), z.number()]).nullable(),
      })
    ),
  }),
});

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

const academicExperience = defineCollection({
  loader: singleFile('src/content/experience/academic.yaml'),
  schema: z.object({
    academicExperience: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        titleEs: z.string().optional(),
        institution: z.string(),
        location: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        current: z.boolean(),
        department: z.string(),
        departmentEs: z.string().optional(),
        program: z.string().optional(),
        programEs: z.string().optional(),
        description: z.string(),
        descriptionEs: z.string().optional(),
        courses: z.array(z.string()),
        coursesEs: z.array(z.string()).optional(),
        highlights: z.array(z.string()),
        // Spanish translation of `highlights`, paired by index, for the
        // EN/ES toggle (same `data-lang-en`/`data-lang-es` pattern used on
        // the Teaching page — see DOCUMENTATION.md §7).
        highlightsEs: z.array(z.string()).optional(),
      })
    ),
  }),
});

const professionalExperience = defineCollection({
  loader: singleFile('src/content/experience/professional.yaml'),
  schema: z.object({
    professionalExperience: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        titleEs: z.string().optional(),
        organization: z.string(),
        organizationEs: z.string().optional(),
        location: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        current: z.boolean(),
        description: z.string(),
        descriptionEs: z.string().optional(),
        highlights: z.array(z.string()),
        highlightsEs: z.array(z.string()).optional(),
      })
    ),
  }),
});

const thesisAdvisory = defineCollection({
  loader: singleFile('src/content/experience/thesis-advisory.yaml'),
  schema: z.object({
    thesisAdvisory: z.array(
      z.object({
        studentName: z.string(),
        thesisTitle: z.string(),
        year: z.number(),
        institution: z.string(),
        role: z.enum(['Advisor', 'Co-Advisor']),
        status: z.enum(['completed', 'in-progress']),
      })
    ),
  }),
});

// ---------------------------------------------------------------------------
// Teaching
// ---------------------------------------------------------------------------

const courses = defineCollection({
  loader: singleFile('src/content/teaching/courses.yaml'),
  schema: z.object({
    courses: z.array(
      z.object({
        courseId: z.string(),
        name: z.string(),
        code: z.string(),
        // Official Spanish course name(s) this course was historically taught
        // under in the SAAC evaluations export (src/content/maps/evaluaciones.yaml),
        // confirmed by the site owner. Used to merge the historical and
        // current teaching records for the same course instead of treating
        // them as two different courses.
        historicalNames: z.array(z.string()).default([]),
        // Spanish translation of `name`, for courses with no historical SAAC
        // record to borrow a Spanish name from (e.g. a brand-new course).
        nameEs: z.string().optional(),
        institution: z.string(),
        level: z.string(),
        description: z.string(),
        topics: z.array(z.string()),
        repositoryUrl: z.string(),
        materialsLink: z.string(),
        semesters: z.array(
          z.object({
            semester: z.string(),
            parallel: z.string(),
            evaluationUrl: z.string().nullable(),
            status: z.enum(['completed', 'in-progress', 'upcoming']).default('completed'),
          })
        ),
      })
    ),
  }),
});

// Full syllabus data extracted from official course PDFs, one file per
// course per language (e.g. `EN-Syllabus-CCPG1034.yaml` /
// `SPA-Syllabus-CCPG1034.yaml`). Drop new files straight into this folder —
// no code changes needed, `src/pages/teaching/[code].astro` picks up any
// course code with at least one matching file automatically.
const teachingSyllabus = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'src/content/teaching/syllabus' }),
  schema: z.object({
    schema_version: z.number(),
    language: z.enum(['en', 'es']),
    source: z.object({
      file: z.string(),
      pages: z.number(),
    }),
    course: z.object({
      code: z.string(),
      name: z.string(),
      document_title: z.string(),
      program: z.string(),
      credits: z.number(),
      contact_hours: z.number(),
      credits_and_contact_hours_text: z.string(),
    }),
    bibliography: z.object({
      textbooks: z.array(z.string()),
      supplemental_materials: z.array(z.string()),
    }),
    course_information: z.object({
      description: z.string(),
      prerequisites: z.array(z.string()),
      corequisites: z.array(z.string()),
      course_type: z.string(),
    }),
    course_goals: z.object({
      instruction_outcomes: z.array(z.string()),
      student_outcomes: z.array(z.string()),
    }),
    topics: z.array(z.string()),
  }),
});

const evaluaciones = defineCollection({
  loader: singleFile('src/content/maps/evaluaciones.yaml'),
  schema: z.object({
    profesorCode: z.number(),
    profesorName: z.string(),
    systematName: z.string(),
    crawlDate: z.string(),
    totalEvaluations: z.number(),
    evaluations: z.array(
      z.object({
        id: z.string(),
        courseId: z.string(),
        courseName: z.string(),
        courseCode: z.string(),
        semester: z.string(),
        year: z.number(),
        term: z.number(),
        academicPeriod: z.string(),
        parallel: z.string(),
        evaluationDate: z.string().nullable(),
        studentCount: z.number().nullable(),
        averageRating: z.number().nullable(),
        evaluationUrl: z.string(),
      })
    ),
  }),
});

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------

const publicationsPublished = defineCollection({
  loader: singleFile('src/content/publications/published.yaml'),
  schema: z.object({
    published: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        authors: z.array(z.string()),
        conference: z.string(),
        year: z.number(),
        month: z.number(),
        status: z.string(),
        doi: z.string().nullable(),
        links: z.record(z.string(), z.string()),
        keywords: z.array(z.string()),
        abstract: z.string(),
        featured: z.boolean().default(false),
      })
    ),
  }),
});

const publicationsAccepted = defineCollection({
  loader: singleFile('src/content/publications/accepted.yaml'),
  schema: z.object({
    accepted: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        authors: z.array(z.string()),
        conference: z.string(),
        year: z.number(),
        // Null until the presentation month is confirmed by the venue.
        month: z.number().nullable(),
        status: z.string(),
        doi: z.string().nullable(),
        links: z.record(z.string(), z.string()),
        keywords: z.array(z.string()),
        abstract: z.string(),
        featured: z.boolean().default(false),
      })
    ),
  }),
});

const publicationsUnderReview = defineCollection({
  loader: singleFile('src/content/publications/under-review.yaml'),
  schema: z.object({
    underReview: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        authors: z.array(z.string()),
        journal: z.string(),
        year: z.number(),
        submittedDate: z.string(),
        status: z.string(),
        expectedPublicationDate: z.string().nullable(),
        links: z.record(z.string(), z.string()),
        keywords: z.array(z.string()),
        abstract: z.string(),
      })
    ),
  }),
});

// ---------------------------------------------------------------------------
// Projects (MDX)
// ---------------------------------------------------------------------------

const projectsResearch = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects/research' }),
  schema: z.object({
    projectId: z.string(),
    name: z.string(),
    year: z.number(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    current: z.boolean(),
    type: z.literal('research'),
    myRole: z.string(),
    collaboration: z.string().nullable(),
    problem: z.string(),
    myContribution: z.string(),
    methodology: z.string(),
    results: z.array(z.string()),
    relatedPapers: z.array(z.string()),
    links: z.record(z.string(), z.string()),
    featured: z.boolean(),
    draft: z.boolean(),
  }),
});

const projectsCommunity = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects/community' }),
  schema: z.object({
    projectId: z.string(),
    name: z.string(),
    year: z.number(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    current: z.boolean(),
    type: z.literal('community'),
    myRole: z.string(),
    description: z.string(),
    draft: z.boolean(),
    problem: z.string(),
    community: z.string(),
    technology: z.string(),
    impact: z.string(),
    links: z.record(z.string(), z.string()),
    featured: z.boolean(),
  }),
});

// ---------------------------------------------------------------------------
// News (MDX)
// ---------------------------------------------------------------------------

const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum([
      'Research',
      'Publications',
      'Conferences',
      'Teaching',
      'Awards',
      'Professional',
    ]),
    slug: z.string(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  personal,
  education,
  certifications,
  interests,
  awardsHonors,
  academicExperience,
  professionalExperience,
  thesisAdvisory,
  courses,
  teachingSyllabus,
  evaluaciones,
  publicationsPublished,
  publicationsAccepted,
  publicationsUnderReview,
  projectsResearch,
  projectsCommunity,
  news,
};
