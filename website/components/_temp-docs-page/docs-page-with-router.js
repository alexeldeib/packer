import DocsPage from '@hashicorp/react-docs-page'
import { useRouter } from 'next/router'

function DocsPageWithRouter({ product, staticProps }) {
  const { currentPath, frontMatter, mdxSource, navData } = staticProps
  //  Get the root path, eg "docs", from next/router
  const router = useRouter()
  const routeParts = router.route.split('/')
  const rootPath = routeParts.slice(1, routeParts.length - 1).join('/')

  //  TODO - investigate if possible to eliminate passing "subpath" down to DocsSidenav... could perhaps instead useRouter within DocsSidenav?
  // ie. as above, get router.route, pop off last part after last slash
  // (which be something like [[...page]])
  // console.log({ router })

  // TODO - rename to editThisPageUrl in DocsPage
  const editThisPageUrl = `https://github.com/hashicorp/${product.slug}/blob/master/website/content/${rootPath}/${currentPath}`

  return (
    <DocsPage
      product={product} // TODO - maybe possible to use new provider rather than prop drilling "product"?
      subpath={rootPath}
      navData={navData}
      editLink={editThisPageUrl}
      staticProps={{
        mdxSource,
        frontMatter,
        currentPath,
      }}
    />
  )
}

export default DocsPageWithRouter
