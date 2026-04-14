import { ProjectDetails } from '@/app/components/pages/project/project-details'
import { ProjectSections } from '@/app/components/pages/project/project-sections'
import {
  ProjectPageData,
  ProjectsPageStaticData
} from '@/app/types/page-info'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraph-query'
import { Metadata } from 'next'

type ProjectProps = {
  params: {
    slug: string
  }
}

// ✅ SAFE DATA FETCHER
const getProjectDetails = async (
  slug: string
): Promise<ProjectPageData | null> => {
  const query = `
    query ProjectQuery {
      project(where: { slug: "${slug}" }) {
        pageThumbnail {
          url
        }
        thumbnail {
          url
        }
        sections {
          title
          image {
            url
          }
        }
        title
        shortDescription
        description {
          raw
          text
        }
        technologies {
          name
        }
        liveProjectUrl
        githubUrl
      }
    }
  `

  const data = await fetchHygraphQuery<ProjectPageData>(query, 150)

  // ✅ HARD GUARD
  if (!data?.project) {
    return null
  }

  return data
}

// ===============================
// PAGE COMPONENT
// ===============================
export default async function Project({ params }: ProjectProps) {
  const data = await getProjectDetails(params.slug)

  // ✅ SAFE FALLBACK
  if (!data?.project) {
    return <div>Project not found</div>
  }

  const project = data.project

  return (
    <>
      <ProjectDetails
        project={{
          ...project,
          // ✅ EXTRA SAFETY
          title: project.title ?? '',
          shortDescription: project.shortDescription ?? '',
          description: {
            raw: project.description?.raw ?? null,
            text: project.description?.text ?? ''
          },
          technologies: project.technologies ?? [],
          sections: project.sections ?? []
        }}
      />

      <ProjectSections sections={project.sections ?? []} />
    </>
  )
}

// ===============================
// STATIC PARAMS (SAFE)
// ===============================
export async function generateStaticParams() {
  const query = `
    query ProjectsSlugsQuery {
      projects(first: 100) {
        slug
      }
    }
  `

  const data = await fetchHygraphQuery<ProjectsPageStaticData>(query)

  if (!data?.projects) {
    return []
  }

  return data.projects
    .filter((p) => p?.slug)
    .map((project) => ({
      slug: project.slug
    }))
}

// ===============================
// METADATA (FULLY SAFE)
// ===============================
export async function generateMetadata({
  params
}: ProjectProps): Promise<Metadata> {
  const data = await getProjectDetails(params.slug)

  if (!data?.project) {
    return {
      title: 'Project not found',
      description: 'This project does not exist'
    }
  }

  const project = data.project

  return {
    title: project.title ?? 'Project',
    description: project.description?.text ?? '',
    openGraph: {
      images: project.thumbnail?.url
        ? [
            {
              url: project.thumbnail.url,
              width: 1200,
              height: 630
            }
          ]
        : []
    }
  }
}