import { supabase } from '../lib/supabase'

export interface PollOption {
  id: string
  text: string
  position: number
  voteCount: number
  voters: string[]
}

export interface Poll {
  id: string
  conversationId: string
  organizationId: string
  creatorId: string
  question: string
  multipleChoice: boolean
  endsAt: string | null
  createdAt: string
  options: PollOption[]
}

type PollRow = {
  id: string
  conversation_id: string
  organization_id: string
  creator_id: string
  question: string
  multiple_choice: boolean
  ends_at: string | null
  created_at: string
  poll_options: Array<{
    id: string
    text: string
    position: number
    poll_votes: Array<{ user_id: string }>
  }>
}

function rowToPoll(r: PollRow): Poll {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    organizationId: r.organization_id,
    creatorId: r.creator_id,
    question: r.question,
    multipleChoice: r.multiple_choice,
    endsAt: r.ends_at,
    createdAt: r.created_at,
    options: (r.poll_options ?? [])
      .sort((a, b) => a.position - b.position)
      .map(o => ({
        id: o.id,
        text: o.text,
        position: o.position,
        voteCount: (o.poll_votes ?? []).length,
        voters: (o.poll_votes ?? []).map(v => v.user_id),
      })),
  }
}

export const PollService = {
  async getById(pollId: string): Promise<Poll | null> {
    const { data } = await supabase
      .from('polls')
      .select('*, poll_options(id, text, position, poll_votes(user_id))')
      .eq('id', pollId)
      .single()
    return data ? rowToPoll(data as unknown as PollRow) : null
  },

  async create(params: {
    conversationId: string
    organizationId: string
    creatorId: string
    question: string
    options: string[]
    multipleChoice: boolean
    endsAt?: string
  }): Promise<Poll | null> {
    const { data: poll, error } = await supabase
      .from('polls')
      .insert({
        conversation_id: params.conversationId,
        organization_id: params.organizationId,
        creator_id: params.creatorId,
        question: params.question,
        multiple_choice: params.multipleChoice,
        ends_at: params.endsAt ?? null,
      })
      .select()
      .single()

    if (error || !poll) return null

    const { error: optErr } = await supabase.from('poll_options').insert(
      params.options.map((text, i) => ({
        poll_id: poll.id,
        text,
        position: i,
      }))
    )
    if (optErr) return null

    return PollService.getById(poll.id)
  },

  async vote(pollId: string, optionId: string, userId: string): Promise<Poll | null> {
    const poll = await PollService.getById(pollId)
    if (!poll) return null

    if (!poll.multipleChoice) {
      // Remove existing vote first (single choice)
      const existingOption = poll.options.find(o => o.voters.includes(userId))
      if (existingOption) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', userId)
      }
    }

    await supabase.from('poll_votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    })

    const updatedPoll = await PollService.getById(pollId)

    // Notify poll creator (unless they're voting on their own poll)
    if (updatedPoll && poll.creatorId !== userId) {
      const votedOption = updatedPoll.options.find(o => o.id === optionId)
      const totalVotes = updatedPoll.options.reduce((s, o) => s + o.voteCount, 0)
      await supabase.rpc('notify_users', {
        p_user_ids: [poll.creatorId],
        p_type: 'poll_vote',
        p_payload: {
          text: `Nouveau vote sur votre sondage «${poll.question}» · ${totalVotes} vote${totalVotes > 1 ? 's' : ''} au total`,
          pollId,
          votedOption: votedOption?.text ?? '',
        },
      })
    }

    return updatedPoll
  },
}
