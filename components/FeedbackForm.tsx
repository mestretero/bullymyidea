'use client'
interface Props { ideaId: string }
export default function FeedbackForm({ ideaId }: Props) {
  return <div data-testid="feedback-form-stub">{ideaId}</div>
}
