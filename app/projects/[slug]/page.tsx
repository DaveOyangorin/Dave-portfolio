import { ProjectDetails } from '@/app/components/pages/project/project-details'
import { ProjectSections } from '@/app/components/pages/project/project-sections'
import { ProjectPageData, ProjectsPageStaticData } from '@/app/types/page-info'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraph-query'
import { Metadata } from 'next'

type ProjectProps = {
  params: {
    slug: string
  }
}

// ✅ SAFE query using variables
const getProjectDetails = async (slug: string): Promise<ProjectPageData | null> => {
  const query = `
    query ProjectQuery($slug: String!) {
      project(where: { slug: $slug }) {
        pageThumbnail { url }
        thumbnail { url }
        sections {
          title
          image { url }
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
    const data = await fetchHygraphQuery<ProjectPageData>(
      query,
      150,
      { slug }
    )

    return data?.project ? data : null
  } catch (error) {
    console.error('Project fetch error:', error)
    return null
  }
}

// ✅ PAGE
export default async function Project({ params: { slug } }: ProjectProps) {
  const data = await getProjectDetails(slug)

  if (!data?.project) {
    return <div>Project not found</div>
  }

  const { project } = data

  return (
    <>
      <ProjectDetails project={project} />
      <ProjectSections sections={project.sections} />
    </>
  )
}

// ✅ STATIC PARAMS (FIXED)
export async function generateStaticParams() {
  const query = `
    query ProjectsSlugsQuery {
      projects(first: 100) {
        slug
      }
    }
  `

  try {
    const data = await fetchHygraphQuery<ProjectsPageStaticData>(query)

    if (!data?.projects) return []

    return data.projects.map((project) => ({
      slug: project.slug,
    }))
  } catch (error) {
    console.error('Static params error:', error)
    return []
  }
}

// ✅ METADATA (SAFE)
export async function generateMetadata({
  params: { slug }
}: ProjectProps): Promise<Metadata> {
  const data = await getProjectDetails(slug)

  if (!data?.project) {
    return {
      title: 'Project not found',
      description: 'No project data available',
    }
  }

  const project = data.project

  return {
    title: project.title,
    description: project.description?.text || '',
    openGraph: {
      images: project.thumbnail?.url
        ? [
            {
              url: project.thumbnail.url,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
  }
}