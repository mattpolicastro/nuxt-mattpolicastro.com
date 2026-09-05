import { postReturnContext, type PostReturnContext } from '~/utils/postNavigation'

export default defineNuxtRouteMiddleware((to, from) => {
  if (!/^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/.test(to.path) || to.path === from.path) return
  const context = useState<PostReturnContext | null>('post-return-context', () => null)
  context.value = postReturnContext(to.path, from)
})
