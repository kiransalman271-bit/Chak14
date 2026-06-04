import Head from 'next/head'

export default function Page({ title, desc, image, redirectUrl }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={redirectUrl} />
        <meta property="og:type" content="article" />
        {image ? <meta property="og:image" content={image} /> : null}
        <meta httpEquiv="refresh" content={'0;url=' + redirectUrl} />
      </Head>
      <p>Redirecting...</p>
    </>
  )
}

export async function getServerSideProps(context) {
  const slugArr = context.params.postpath || []
  const slugPath = Array.isArray(slugArr) ? slugArr.join('/') : slugArr

  const endpoint = process.env.GRAPHQL_ENDPOINT || ''
  const wpBase = endpoint.replace('/graphql/', '').replace('/graphql', '')
  const redirectUrl = wpBase + '/' + slugPath + '/'

  const ua = context.req.headers['user-agent'] || ''
  const isFbBot =
    ua.indexOf('facebookexternalhit') > -1 || ua.indexOf('Facebot') > -1

  if (!isFbBot) {
    return { redirect: { destination: redirectUrl, permanent: false } }
  }

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
    const post = json && json.data ? json.data.postBy : null
    return {
      props: {
        title: post && post.title ? post.title : '',
        desc:
          post && post.excerpt
            ? post.excerpt.replace(/<[^>]*>/g, '')
            : '',
        image:
          post && post.featuredImage
            ? post.featuredImage.node.sourceUrl
            : '',
        redirectUrl,
      },
    }
  } catch (e) {
    return { redirect: { destination: redirectUrl, permanent: false } }
  }
}
