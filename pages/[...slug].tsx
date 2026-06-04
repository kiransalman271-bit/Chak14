import { GetServerSideProps } from 'next'
import Head from 'next/head'

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT as string

interface Post {
  title: string
  excerpt: string
  link: string
  featuredImage: { node: { sourceUrl: string } } | null
}

interface Props {
  post: Post | null
  redirectUrl: string
}

export default function Page({ post, redirectUrl }: Props) {
  const description = post?.excerpt?.replace(/<[^>]*>/g, '') || ''
  return (
    <>
      <Head>
        <title>{post?.title || 'Redirecting...'}</title>
        <meta property="og:title" content={post?.title || ''} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={redirectUrl} />
        <meta property="og:type" content="article" />
        {post?.featuredImage && (
          <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        )}
        <meta httpEquiv="refresh" content={`0;url=${redirectUrl}`} />
      </Head>
      <p>Redirecting to article...</p>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slugArr = ctx.params?.slug as string[]
  const slugPath = slugArr.join('/')
  const ua = ctx.req.headers['user-agent'] || ''
  const isFbBot = ua.includes('facebookexternalhit') || ua.includes('Facebot')

  const wpBase = GRAPHQL_ENDPOINT.replace(/\/graphql\/?$/, '')
  const redirectUrl = `${wpBase}/${slugPath}/`

  if (!isFbBot) {
    return { redirect: { destination: redirectUrl, permanent: false } }
  }

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($slug: String!) {
          postBy(slug: $slug) {
            title excerpt link
            featuredImage { node { sourceUrl } }
          }
        }`,
        variables: { slug: slugPath },
      }),
    })
    const json = await res.json()
    const post: Post = json?.data?.postBy || null
    return { props: { post, redirectUrl } }
  } catch {
    return { props: { post: null, redirectUrl } }
  }
}
