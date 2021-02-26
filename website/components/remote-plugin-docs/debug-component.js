import { useRouter } from 'next/router'

function DocsPageDebug({ frontMatter, navNode, mdxSource, mdxString }) {
  //  Get the root path, eg "docs", from next/router
  const router = useRouter()
  const routeParts = router.route.split('/')
  const rootPath = routeParts.slice(1, routeParts.length - 1).join('/')

  //  Determine if remote content
  const isRemoteContent = !!navNode.remoteFile
  const background = isRemoteContent ? 'aliceblue' : 'var(--gray-7)'
  const border = `1px solid ${isRemoteContent ? 'dodgerblue' : 'var(--gray-6)'}`

  return (
    <div className="g-grid-container">
      <p style={{ background, border, padding: '1rem' }}>
        {isRemoteContent ? '📡 Remote Content' : '💼 Local Content'}
      </p>
      <details>
        <summary>Debug page data</summary>
        <div style={{ display: 'flex' }}>
          <pre style={{ width: '50%', marginRight: '8px' }}>
            <code>
              {'// route data'}
              <br />
              <br />
              {JSON.stringify(
                {
                  rootPath,
                  routerPath: router.asPath,
                  params: router.query,
                },
                null,
                2
              )}
            </code>
          </pre>

          <pre style={{ width: '50%' }}>
            <code>
              {'// nav node'}
              <br />
              <br />
              {JSON.stringify(navNode, null, 2)}
            </code>
          </pre>
        </div>
        <pre>
          <code>{JSON.stringify({ frontMatter }, null, 2)}</code>
        </pre>

        <pre>
          <code>{mdxString}</code>
        </pre>

        <pre>
          <code>{JSON.stringify({ mdxSource }, null, 2)}</code>
        </pre>
      </details>
    </div>
  )
}

export default DocsPageDebug
