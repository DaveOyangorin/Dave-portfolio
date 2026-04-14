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

// ✅ Safer: returns null if anything fails
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

  if (!data || !data.project) {
    return null
  }

  return data
}

export default async function Project({ params }: ProjectProps) {
  const data = await getProjectDetails(params.slug)

  if (!data) {
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

  return data.projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({
  params
}: ProjectProps): Promise<Metadata> {
  const data = await getProjectDetails(params.slug)

  if (!data || !data.project) {
    return {
      title: 'Project not found',
      description: 'This project does not exist'
    }
  }

  const { project } = data

  return {
    title: project.title,
    description: project.description.text,
    openGraph: {
      images: [
        {
          url: project.thumbnail?.url || '',
          width: 1200,
          height: 630
        }
      ]
    }
  }
}