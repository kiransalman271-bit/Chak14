import { GetServerSideProps } from 'next'
import Head from 'next/head'

interface Props {
  title: string
  description: string
  image: string
  redirectUrl: string
}

export default function Page({ title, description, image, redirectUrl }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={redirectUrl} />
        <meta property="og:type" content="article" />
        {image ? <meta property="og:image" content={image} /> : null}
        <meta httpEquiv="refresh" content={'0;url=' + redirectUrl} />
      </Head>
      <p>Redirecting...</p>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const params = ctx.params
  const slugArr = params && params.slug ? (params.slug as string[]) : []
  const slugPath = slugArr.join('/')
  const ua = ctx.req.headers['user-agent'] || ''
  const isFbBot =
    ua.indexOf('facebookexternalhit') > -1 || ua.indexOf('Facebot') > -1

  const endpoint = process.env.GRAPHQL_ENDPOINT || ''
  const wpBase = endpoint.replace('/graphql/', '').replace('/graphql', '')
  const redirectUrl = wpBase + '/' + slugPath + '/'

  if (!isFbBot) {
    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    }
  }

  let title = ''
  let description = ''
  let image = ''

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'query($slug: String!) { postBy(slug: $slug) { title excerpt featuredImage { node { sourceUrl } } } }',
        variables: { slug: slugPath },
      }),
    })
    const json = await res.json()
    const post = json && json.data && json.data.postBy ? json.data.postBy : null
    if (post) {
      title = post.title || ''
      description = post.excerpt
        ? post.excerpt.replace(/<[^>]*>/g, '')
        : ''
      image =
        post.featuredImage && post.featuredImage.node
          ? post.featuredImage.node.sourceUrl
          : ''
    }
  } catch (e) {
    console.log('GraphQL fetch error', e)
  }

  return {
    props: { title, description, image, redirectUrl },
  }
}
