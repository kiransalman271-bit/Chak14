import type { NextApiRequest, NextApiResponse } from 'next'

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT as string

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postpath } = req.query
  const slugArr = Array.isArray(postpath) ? postpath : [postpath || '']
  const slugPath = slugArr.join('/')

  const ua = req.headers['user-agent'] || ''
  const isFbBot =
    ua.indexOf('facebookexternalhit') > -1 || ua.indexOf('Facebot') > -1

  const wpBase = GRAPHQL_ENDPOINT.replace('/graphql/', '').replace('/graphql', '')
  const redirectUrl = wpBase + '/' + slugPath + '/'

  if (!isFbBot) {
    res.redirect(307, redirectUrl)
    return
  }

  try {
    const graphRes = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query($slug: String!) { postBy(slug: $slug) { title excerpt featuredImage { node { sourceUrl } } } }',
        variables: { slug: slugPath },
      }),
    })
    const json = await graphRes.json()
    const post = json && json.data ? json.data.postBy : null
    const title = post && post.title ? post.title : ''
    const desc = post && post.excerpt ? post.excerpt.replace(/<[^>]*>/g, '') : ''
    const image = post && post.featuredImage ? post.featuredImage.node.sourceUrl : ''

    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${redirectUrl}" />
<meta property="og:type" content="article" />
${image ? `<meta property="og:image" content="${image}" />` : ''}
<meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body><p>Redirecting...</p></body>
</html>`)
  } catch (e) {
    res.redirect(307, redirectUrl)
  }
}
