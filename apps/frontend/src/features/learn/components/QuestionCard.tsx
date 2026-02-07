import type { OptionLetter } from '../types'

interface MultipleChoiceQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

interface QuestionCardProps {
  question: MultipleChoiceQuestion
  questionNumber?: number
  totalQuestions?: number
  selectedOption: OptionLetter | null
  onSelectOption: (option: OptionLetter) => void
  isLocked?: boolean // When answer is already submitted
}

/**
 * QuestionCard - Displays a single question with 4 options
 *
 * Shows question text and clickable option buttons.
 * Selected option is highlighted in blue.
 */
export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  isLocked = false,
}: QuestionCardProps) {
  const options: { letter: OptionLetter; text: string }[] = [
    { letter: 'A', text: question.option_a },
    { letter: 'B', text: question.option_b },
    { letter: 'C', text: question.option_c },
    { letter: 'D', text: question.option_d },
  ]

  return (
    <div className="rl-card p-6">
      {/* Question header */}
      {questionNumber && totalQuestions ? (
        <div className="mb-4">
          <span className="text-sm text-[var(--text-secondary)]">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
      ) : null}

      {/* Question text */}
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
        {question.question_text}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.letter

          return (
            <button
              key={option.letter}
              onClick={() => !isLocked && onSelectOption(option.letter)}
              disabled={isLocked}
              className={`
                w-full text-left p-4 rounded-[var(--radius-input)] border transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,229,138,0.18)]
                ${isSelected
                  ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow-soft)] text-[#0b1020]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:brightness-110'
                }
                ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
              `}
            >
              <span className="font-medium mr-3">{option.letter}.</span>
              {option.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
