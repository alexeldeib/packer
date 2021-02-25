import DocsSidenav from '@hashicorp/react-docs-sidenav'
import { useRouter } from 'next/router'

/*

<D ocsPage
  product={{ name: "Packer", slug: "packer" }}
  subpath="docs"
  navData={navData}
  editLink={editLink}
  showEditPage={true}
  additionalComponents={}
  staticProps={{
    mdxSource,
    frontMatter,
    currentPath
  }}
/>

*/

//
//
//
// All code below is meant to be
// moved into D ocsPage, just hanging out
// here for now during development
//
//
//

function DocsPageDev({ product, currentPath, navData }) {
  //  Get the root path, eg "docs", from next/router
  const router = useRouter()
  const routeParts = router.route.split('/')
  const rootPath = routeParts.slice(1, routeParts.length - 1).join('/')

  // const editLink = `https://github.com/hashicorp/${product.slug}/blob/master/website/content/${rootPath}/${currentPath}`

  return (
    <div className="g-grid-container">
      <div style={{ display: 'flex' }}>
        <div style={{ maxWidth: '400px' }}>
          <DocsSidenav
            product={product.slug} // any Product slug, used for theming
            rootPath={rootPath} // root URL path for content, eg "docs"
            currentPath={currentPath} // active path, relative to rootPath
            navData={navData} // the navData
          />
        </div>
      </div>
    </div>
  )
}

export default DocsPageDev
