import { redirect } from 'vike/abort'
import { PageContextServer } from 'vike/types'
 
export const guard = (_pageContext: PageContextServer) => {
  if (typeof window !== "undefined") {
    return;
  }

  if (!_pageContext.userData?.is_moderator) {
    throw redirect('/')
  }
}
