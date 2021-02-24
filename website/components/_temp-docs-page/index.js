import DocsSidenav from '@hashicorp/react-docs-sidenav'
import s from './style.module.css'
import { useRouter } from 'next/router'

//
//
//
// All code below is meant to be
// moved into DocsPage, just hanging out
// here for now during development
//
//
//

function DocsPageDev({ staticProps }) {
  const {
    params,
    navNode,
    rawMdx,
    navData,
    localContentDir,
    navDataWithPlugins,
  } = staticProps
  //  Get the root path, eg "docs", from next/router
  const router = useRouter()
  const routeParts = router.route.split('/')
  const rootPath = routeParts.slice(1, routeParts.length - 1).join('/')

  // Build the currentPath from slug parameters
  const currentPath = !params.slug ? '' : params.slug.join('/')

  const isRemoteContent = !!navNode.remoteFile
  const background = isRemoteContent ? 'aliceblue' : 'var(--gray-7)'
  const border = `1px solid ${isRemoteContent ? 'dodgerblue' : 'var(--gray-6)'}`

  return (
    <div className={s.container}>
      <div style={{ display: 'flex' }}>
        <DocsSidenav
          product="packer" // any Product slug, used for theming
          rootPath={rootPath} // root URL path for content, eg "docs"
          currentPath={currentPath} // active path, relative to rootPath
          navData={navData} // the navData
        />

        <div style={{ width: '0', flexGrow: 1 }}>
          <p style={{ background, border, padding: '1rem' }}>
            {isRemoteContent ? '📡 Remote Content' : '💼 Local Content'}
          </p>

          <pre>
            <code>{JSON.stringify(navDataWithPlugins, null, 2)}</code>
          </pre>

          <div style={{ display: 'flex' }}>
            <pre style={{ width: '50%', marginRight: '8px' }}>
              <code>
                {'// route data'}
                <br />
                <br />
                {JSON.stringify(
                  {
                    localContentDir,
                    rootPath,
                    currentPage: `/${rootPath}/${currentPath}`,
                    params,
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

          {/* <pre>
            <code>{JSON.stringify(navData, null, 2)}</code>
          </pre> */}

          <pre>
            <code>{rawMdx}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default DocsPageDev
