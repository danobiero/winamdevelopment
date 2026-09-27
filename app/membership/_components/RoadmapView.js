import {
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  BellAlertIcon,
  ScaleIcon,
  ClockIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import LoginMessage from '@/app/_components/LoginMessage';

const steps = [
  {
    id: 1,
    title: 'Submit Application',
    description:
      'Send in your membership application through our secure portal.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    id: 2,
    title: 'Pay Application Fees',
    description:
      'A one-time processing fee is required to initiate the review.',
    icon: CreditCardIcon,
  },
  {
    id: 3,
    title: 'Board Review',
    description: 'The Winam Board of Directors will review your application.',
    icon: UserGroupIcon,
  },
  {
    id: 4,
    title: 'Decision Notification',
    description: 'You will be formally notified via email of the decision.',
    icon: BellAlertIcon,
  },
  {
    id: 5,
    title: 'Operating Agreement & Contributions',
    description: 'Sign the Operating Agreement and begin your shareholding.',
    icon: ScaleIcon,
    highlight: 'Minimum Shareholding: $2,000',
  },
  {
    id: 6,
    title: '12-Month Completion',
    description: 'Fund your minimum shareholding within 12 months.',
    icon: ClockIcon,
  },
  {
    id: 7,
    title: 'Unlock Winam Ecosystem',
    description: 'Gain full access to invest in selective ventures.',
    icon: RocketLaunchIcon,
  },
];

const stepStatusMap = {
  applied: 1,
  reviewing: 3,
  rejected: 4,
  approved: 5,
  active: 6,
  completed: 7,
};

export default function RoadmapView({ session, membershipRecord, onStart }) {
  const status = membershipRecord?.status;
  const currentStep = stepStatusMap[status] || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 mb-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-primary-950 mb-4">
          Start the <span className="text-blue-600">Winam</span> Journey
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Our membership process is designed to build a committed community of
          investors dedicated to long-term wealth creation.
        </p>
        {membershipRecord && (
          <div className="mt-6 text-sm font-bold text-slate-500 uppercase">
            Current Step: {currentStep} of 7
          </div>
        )}
      </div>

      <div className="relative border-l-2 border-primary-100 ml-4 md:ml-10 space-y-12">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="relative pl-8 md:pl-16">
              <div
                className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                      ? 'bg-yellow-500'
                      : 'bg-primary-600'
                }`}
              />
              <div
                className={`bg-white border p-6 rounded-2xl shadow-sm transition-all duration-300 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isCurrent
                      ? 'border-yellow-300 bg-yellow-50/40 shadow-md'
                      : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                  <div
                    className={`p-3 rounded-xl w-fit ${
                      isCompleted
                        ? 'bg-emerald-100'
                        : isCurrent
                          ? 'bg-yellow-100'
                          : 'bg-primary-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <step.icon
                        className={`h-6 w-6 ${isCurrent ? 'text-yellow-600' : 'text-primary-600'}`}
                      />
                    )}
                  </div>
                  <h3
                    className={`text-xl md:text-2xl font-bold ${
                      isCompleted
                        ? 'text-emerald-900'
                        : isCurrent
                          ? 'text-yellow-900'
                          : 'text-slate-900'
                    }`}
                  >
                    <span
                      className={
                        isCompleted
                          ? 'text-emerald-600'
                          : isCurrent
                            ? 'text-yellow-600'
                            : 'text-primary-600'
                      }
                    >
                      {step.id}.
                    </span>{' '}
                    {step.title}
                  </h3>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  {step.description}
                </p>
                {step.highlight && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-100">
                    <CheckBadgeIcon className="h-5 w-5" /> {step.highlight}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 text-center bg-primary-950 text-white p-10 rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        {session?.user ? (
          <button
            onClick={onStart}
            className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-xl text-xl font-bold transition-all transform active:scale-95 shadow-lg"
          >
            Apply for Membership
          </button>
        ) : (
          <div className="bg-slate-400 p-8 rounded-2xl border border-slate-200 shadow-sm inline-block mt-4 max-w-md text-left">
            {/* The login message logic from your original code */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                  {/* Google Icon SVG */}
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <p className="text-slate-900 font-bold text-xl tracking-tight">
                  Secure Access
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-slate-900 text-base leading-relaxed">
                  To begin your shareholder application and access the{' '}
                  <span className="font-semibold text-slate-900">
                    Core Portfolio
                  </span>
                  , please authenticate using your Google account.
                </p>
                <p className="text-xs text-slate-900 italic">
                  * We only request basic profile access for identity
                  verification.
                </p>
              </div>
              <div className="w-full pt-1">
                <LoginMessage />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
