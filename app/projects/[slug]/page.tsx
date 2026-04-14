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

// ✅ SAFE FETCH FUNCTION
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

  try {
    const data = await fetchHygraphQuery<ProjectPageData>(query, 150)

    if (!data?.project) return null

    // Normalize data to prevent runtime crashes
    return {
      project: {
        ...data.project,
        title: data.project.title ?? '',
        shortDescription: data.project.shortDescription ?? '',
        description: {
          raw: data.project.description?.raw ?? null,
          text: data.project.description?.text ?? ''
        },
        thumbnail: {
          url: data.project.thumbnail?.url ?? ''
        },
        pageThumbnail: {
          url: data.project.pageThumbnail?.url ?? ''
        },
        sections: data.project.sections ?? [],
        technologies: data.project.technologies ?? [],
        liveProjectUrl: data.project.liveProjectUrl ?? '',
        githubUrl: data.project.githubUrl ?? ''
      }
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

// ✅ PAGE COMPONENT
export default async function Project({ params }: ProjectProps) {
  const data = await getProjectDetails(params.slug)

  if (!data?.project) {
    return <div>Project not found</div>
  }

  const { project } = data

  return (
    <>
      <ProjectDetails project={project} />
      <ProjectSections sections={project.sections ?? []} />
    </>
  )
}

// ✅ STATIC PARAMS (SAFE)
export async function generateStaticParams() {
  const query = `
    query ProjectsSlugsQuery {
      projects(first: 100) {
        slug
      }
    }
  `

  try {
    const data =
      await fetchHygraphQuery<ProjectsPageStaticData>(query)

    if (!data?.projects) return []

    return data.projects
      .filter((p) => p?.slug)
      .map((project) => ({
        slug: project.slug
      }))
  } catch (error) {
    console.error('Error fetching slugs:', error)
    return []
  }
}

// ✅ METADATA (FULLY SAFE)
export async function generateMetadata({
  params
}: ProjectProps): Promise<Metadata> {
  const data = await getProjectDetails(params.slug)

  const project = data?.project

  if (!project) {
    return {
      title: 'Project not found',
      description: 'This project does not exist'
    }
  }

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