import { CheckCircle2Icon, Loader2Icon } from "lucide-react"

const ALL_STEPS = [
  { type: 'navbar',   label: 'Navigation Bar',    emoji: '🧭' },
  { type: 'hero',     label: 'Hero Section',       emoji: '🌟' },
  { type: 'features', label: 'Features Section',   emoji: '✨' },
  { type: 'about',    label: 'About Section',      emoji: '📖' },
  { type: 'pricing',  label: 'Pricing Section',    emoji: '💳' },
  { type: 'cta',      label: 'Call to Action',     emoji: '📣' },
  { type: 'footer',   label: 'Footer',             emoji: '🔗' },
]

interface LoaderStepsProps {
  currentIndex?: number;   // which component is currently being generated (0-based)
  doneCount?: number;      // how many are fully done
  total?: number;
  currentLabel?: string;
}

const LoaderSteps = ({ currentIndex, doneCount = 0, total = 7, currentLabel }: LoaderStepsProps) => {
  const steps = ALL_STEPS.slice(0, total)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-white px-6 py-10 overflow-auto">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-fuchsia-500/10 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            AI is building your website
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Building components...</h2>
          <p className="text-gray-400 text-sm">Each section is crafted individually for best results</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>

        {/* Steps list */}
        <div className="flex flex-col gap-2">
          {steps.map((step, i) => {
            const isDone = i < doneCount
            const isActive = i === currentIndex
            const isPending = !isDone && !isActive

            return (
              <div
                key={step.type}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-green-900/20 border-green-700/40 text-green-300'
                    : isActive
                    ? 'bg-indigo-900/30 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-gray-900/40 border-gray-800/60 text-gray-500'
                }`}
              >
                <span className={`text-base ${isPending ? 'opacity-30' : ''}`}>
                  {step.emoji}
                </span>
                <span className={`flex-1 text-sm font-medium ${isPending ? 'opacity-40' : ''}`}>
                  {step.label}
                </span>
                <span className="ml-auto shrink-0">
                  {isDone ? (
                    <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                  ) : isActive ? (
                    <Loader2Icon className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-gray-700 block" />
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {doneCount} of {total} components built · this usually takes 1–2 minutes
        </p>
      </div>
    </div>
  )
}

export default LoaderSteps
