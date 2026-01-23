import type { TestQuestion, OptionLetter } from '../types'

interface QuestionCardProps {
  question: TestQuestion
  questionNumber: number
  totalQuestions: number
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Question header */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Question text */}
      <h2 className="text-lg font-medium text-gray-900 mb-6">
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
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
