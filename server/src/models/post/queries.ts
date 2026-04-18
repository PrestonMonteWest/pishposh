import type { DB, VoteValue } from '@/db/types.js'
import type { ExpressionBuilder } from 'kysely'

/**
 * Builds the SELECT expression for the current viewer's vote on a post.
 * When viewerId is null (unauthenticated), resolves to null.
 * When viewerId is set, returns a correlated subquery that looks up
 * the viewer's vote row for each post in the outer query.
 *
 * Intended to be used inside a `.select(eb => ...)` call on a query
 * whose FROM clause includes `posts`.
 */
export function viewerVoteExpression(
  eb: ExpressionBuilder<DB, 'posts'>,
  viewerId: string | null,
) {
  if (!viewerId) {
    return eb.val<VoteValue | null>(null).as('viewer_vote')
  }

  return eb
    .selectFrom('post_votes as pv')
    .select('pv.value')
    .whereRef('pv.post_id', '=', 'posts.id')
    .where('pv.user_id', '=', viewerId)
    .$asScalar()
    .as('viewer_vote')
}
