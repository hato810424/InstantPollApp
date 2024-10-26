import { redirect } from 'vike/abort'
import { PageContextServer } from 'vike/types'
 
export const guard = (_pageContext: PageContextServer) => {
  if (!_pageContext.userData) {
    throw redirect('/')
  }
}
