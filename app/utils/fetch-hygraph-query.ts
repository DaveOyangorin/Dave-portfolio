export async function fetchHygraphQuery<T>(
  query: string,
  revalidate: number = 0,
  variables?: Record<string, any>
): Promise<T> {
  const endpoint = process.env.HYGRAPH_ENDPOINT

  if (!endpoint) {
    throw new Error('HYGRAPH_ENDPOINT is missing')
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.HYGRAPH_TOKEN
        ? `Bearer ${process.env.HYGRAPH_TOKEN}`
        : '',
    },
    next: { revalidate },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const json = await res.json()

  if (!res.ok || json.errors) {
    console.error('Hygraph FULL Error:', JSON.stringify(json, null, 2))
    throw new Error('Failed to fetch Hygraph')
  }

  return json.data
}