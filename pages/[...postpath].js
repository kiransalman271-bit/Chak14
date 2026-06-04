import Head from 'next/head'

export default function Page({ title, desc, image, imageWidth, imageHeight, redirectUrl }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={redirectUrl} />
        <meta property="og:type" content="article" />
        {image ? <meta property="og:image" content={image} /> : null}
        {image ? <meta property="og:image:secure_url" content={image} /> : null}
        {imageWidth ? <meta property="og:image:width" content={imageWidth} /> : null}
        {imageHeight ? <meta property="og:image:height" content={imageHeight} /> : null}
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
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
        query: `query($slug: String!) {
          postBy(slug: $slug) {
            title
            excerpt
            featuredImage {
              node {
                sourceUrl
                mediaDetails { width height }
              }
            }
          }
        }`,
        variables: { slug: slugPath },
      }),
    })
    const json = await res.json()
    const post = json && json.data ? json.data.postBy : null
    const img = post && post.featuredImage ? post.featuredImage.node : null
    return {
      props: {
        title: post && post.title ? post.title : '',
        desc: post && post.excerpt ? post.excerpt.replace(/<[^>]*>/g, '') : '',
        image: img ? img.sourceUrl : '',
        imageWidth: img && img.mediaDetails ? String(img.mediaDetails.width) : '1200',
        imageHeight: img && img.mediaDetails ? String(img.mediaDetails.height) : '630',
        redirectUrl,
      },
    }
  } catch (e) {
    return { redirect: { destination: redirectUrl, permanent: false } }
  }
}
