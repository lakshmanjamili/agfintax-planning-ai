import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#131318]">
      {/* Mesh gradient background */}
      <div className="mesh-gradient pointer-events-none absolute inset-0" />

      {/* Orange accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#dc5700] via-[#ffb596] to-[#4cd6fb]" />

      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#e4e1e9]">
              AG <span className="mesh-gradient-text">FinTax</span>
            </h1>
            <p className="mt-2 text-sm text-[#c7c5d3]">
              Create your account to start planning smarter
            </p>
          </div>

          {/* Clerk SignUp Component */}
          <div className="glass-card flex justify-center rounded-2xl p-6">
            <SignUp
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border-none",
                  headerTitle: "text-[#e4e1e9]",
                  headerSubtitle: "text-[#c7c5d3]",
                  socialButtonsBlockButton:
                    "border-[rgba(70,70,81,0.3)] text-[#e4e1e9] hover:bg-[#1f1f25]",
                  formButtonPrimary:
                    "bg-[#dc5700] hover:bg-[#ffb596] text-white",
                  formFieldInput:
                    "bg-[#1f1f25] border-[rgba(70,70,81,0.3)] text-[#e4e1e9]",
                  footerActionLink: "text-[#ffb596] hover:text-[#dc5700]",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
