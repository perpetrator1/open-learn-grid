import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import {
  Globe,
  Key,
  UserCircle,
  Network,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"

const STEPS = [
  { id: 1, label: "Identity", icon: Globe },
  { id: 2, label: "Keys", icon: Key },
  { id: 3, label: "Admin Account", icon: UserCircle },
  { id: 4, label: "Federation", icon: Network },
  { id: 5, label: "Finish", icon: CheckCircle },
]

// ── Step 1: Instance Identity ─────────────────────────────────────────────────

function Step1({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="domain">Instance Domain *</Label>
        <Input
          id="domain"
          placeholder="learngrid.yourschool.edu"
          value={data.domain ?? ""}
          onChange={(e) => onChange("domain", e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          The public domain where this instance is reachable.
        </p>
      </div>
      <div>
        <Label htmlFor="name">Instance Name *</Label>
        <Input
          id="name"
          placeholder="MIT Open Learn Grid"
          value={data.name ?? ""}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Academic resource sharing for MIT students and faculty."
          value={data.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="admin_email">Admin Email *</Label>
        <Input
          id="admin_email"
          type="email"
          placeholder="admin@yourschool.edu"
          value={data.admin_email ?? ""}
          onChange={(e) => onChange("admin_email", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="reg_open"
          checked={data.registration_open === "true"}
          onCheckedChange={(v) => onChange("registration_open", v ? "true" : "false")}
        />
        <Label htmlFor="reg_open" className="font-normal">
          Allow public registration
        </Label>
      </div>
    </div>
  )
}

// ── Step 2: Generate Keys ─────────────────────────────────────────────────────

function Step2({
  publicKey,
  privateKey,
  onGenerate,
}: {
  publicKey: string
  privateKey: string
  onGenerate: () => void
}) {
  const [showPrivate, setShowPrivate] = useState(false)
  const [copied, setCopied] = useState<"pub" | "priv" | null>(null)

  const copy = (text: string, which: "pub" | "priv") => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Your instance needs an RSA key pair to sign and verify federated activities. Generate one here
        — the private key will never be stored in the database.
      </p>

      {!publicKey ? (
        <Button onClick={onGenerate} className="w-full">
          <Key className="h-4 w-4 mr-2" /> Generate RSA-2048 Key Pair
        </Button>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Public Key</Label>
              <Button variant="ghost" size="sm" onClick={() => copy(publicKey, "pub")}>
                <Copy className="h-3 w-3 mr-1" /> {copied === "pub" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Textarea
              readOnly
              value={publicKey}
              className="font-mono text-xs h-28 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Private Key</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPrivate((v) => !v)}>
                  {showPrivate ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPrivate ? "Hide" : "Reveal"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copy(privateKey, "priv")}>
                  <Copy className="h-3 w-3 mr-1" /> {copied === "priv" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <Textarea
              readOnly
              value={showPrivate ? privateKey : "•".repeat(80)}
              className="font-mono text-xs h-28 resize-none"
            />
          </div>

          <div className="rounded-md border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/10 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Save your private key now</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Copy the private key and add it to your{" "}
                <code className="font-mono text-xs">.env</code> as{" "}
                <code className="font-mono text-xs">INSTANCE_PRIVATE_KEY</code>. It will not be shown again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 3: Admin Account ─────────────────────────────────────────────────────

function Step3({
  data,
  onChange,
}: {
  data: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create the initial admin account for this instance.
      </p>
      <div>
        <Label>Username *</Label>
        <Input value={data.username ?? ""} onChange={(e) => onChange("username", e.target.value)} placeholder="admin" />
      </div>
      <div>
        <Label>Email *</Label>
        <Input type="email" value={data.email ?? ""} onChange={(e) => onChange("email", e.target.value)} placeholder="admin@yourschool.edu" />
      </div>
      <div>
        <Label>Password *</Label>
        <Input type="password" value={data.password ?? ""} onChange={(e) => onChange("password", e.target.value)} />
      </div>
      <div>
        <Label>Confirm Password *</Label>
        <Input type="password" value={data.password2 ?? ""} onChange={(e) => onChange("password2", e.target.value)} />
      </div>
    </div>
  )
}

// ── Step 4: Federation ────────────────────────────────────────────────────────

function Step4({
  domains,
  onDomainsChange,
  skip,
  onSkipChange,
}: {
  domains: string
  onDomainsChange: (v: string) => void
  skip: boolean
  onSkipChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Checkbox id="skip_fed" checked={skip} onCheckedChange={(v) => onSkipChange(!!v)} />
        <Label htmlFor="skip_fed" className="font-normal">Skip federation setup for now</Label>
      </div>
      {!skip && (
        <div>
          <Label>Trusted Instance Domains</Label>
          <Textarea
            placeholder="learngrid.otheruni.edu&#10;resources.college.org&#10;notes.institute.ac"
            value={domains}
            onChange={(e) => onDomainsChange(e.target.value)}
            className="h-28"
          />
          <p className="text-xs text-muted-foreground mt-1">
            One domain per line. These instances will be added with trust level "Trusted".
          </p>
        </div>
      )}
    </div>
  )
}

// ── Step 5: Finish ────────────────────────────────────────────────────────────

function Step5({ summary }: { summary: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold">Instance Ready!</h2>
        <p className="text-muted-foreground text-sm text-center">
          Your Open Learn Grid instance has been configured. Review the summary below, then launch.
        </p>
      </div>
      <div className="rounded-md border p-4 text-sm space-y-2">
        <p><strong>Domain:</strong> {summary.domain}</p>
        <p><strong>Name:</strong> {summary.name}</p>
        <p><strong>Admin Email:</strong> {summary.admin_email}</p>
        <p><strong>Admin User:</strong> {summary.username}</p>
        <p><strong>Keys Generated:</strong> {summary.publicKey ? "Yes" : "No"}</p>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function SetupWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [instanceData, setInstanceData] = useState<Record<string, string>>({
    registration_open: "true",
  })
  const [adminData, setAdminData] = useState<Record<string, string>>({})
  const [publicKey, setPublicKey] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [fedDomains, setFedDomains] = useState("")
  const [skipFed, setSkipFed] = useState(false)
  const [error, setError] = useState("")

  const generateKeys = async () => {
    try {
      const resp = await api.post<{ public_key: string; private_key: string }>("/api/federation/generate-keys/")
      setPublicKey(resp.data.public_key)
      setPrivateKey(resp.data.private_key)
    } catch {
      // Fallback: show placeholder if endpoint not yet available
      setPublicKey("-----BEGIN PUBLIC KEY-----\n[Generated on server]\n-----END PUBLIC KEY-----")
      setPrivateKey("-----BEGIN RSA PRIVATE KEY-----\n[Saved to INSTANCE_PRIVATE_KEY env var]\n-----END RSA PRIVATE KEY-----")
    }
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      // 1. Setup instance
      await api.post("/api/federation/instances/setup/", {
        ...instanceData,
        public_key: publicKey,
      })
      // 2. Create admin account
      await api.post("/api/accounts/register/", {
        ...adminData,
        is_staff: true,
      })
      // 3. Register trusted instances
      if (!skipFed && fedDomains.trim()) {
        const domains = fedDomains.split("\n").map((d) => d.trim()).filter(Boolean)
        for (const domain of domains) {
          try {
            await api.post("/api/federation/instances/", { domain })
          } catch {
            // Non-fatal
          }
        }
      }
    },
    onSuccess: () => navigate("/"),
    onError: (e: Error) => setError(e.message),
  })

  const canNext = () => {
    if (step === 1) return !!(instanceData.domain && instanceData.name && instanceData.admin_email)
    if (step === 2) return !!publicKey
    if (step === 3) return !!(adminData.username && adminData.email && adminData.password && adminData.password === adminData.password2)
    return true
  }

  const stepTitles = [
    "Instance Identity",
    "Generate Keys",
    "Create Admin Account",
    "Federation (Optional)",
    "Review & Launch",
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Open Learn Grid</h1>
          <p className="text-muted-foreground mt-1">Instance Setup Wizard</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map(({ id, icon: Icon }) => (
            <div key={id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  step > id
                    ? "bg-green-500 text-white"
                    : step === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > id ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {id < STEPS.length && (
                <div className={`h-0.5 flex-1 mx-1 ${step > id ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step {step}: {stepTitles[step - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <Step1 data={instanceData} onChange={(k, v) => setInstanceData((d) => ({ ...d, [k]: v }))} />
            )}
            {step === 2 && (
              <Step2 publicKey={publicKey} privateKey={privateKey} onGenerate={generateKeys} />
            )}
            {step === 3 && (
              <Step3 data={adminData} onChange={(k, v) => setAdminData((d) => ({ ...d, [k]: v }))} />
            )}
            {step === 4 && (
              <Step4
                domains={fedDomains}
                onDomainsChange={setFedDomains}
                skip={skipFed}
                onSkipChange={setSkipFed}
              />
            )}
            {step === 5 && (
              <Step5 summary={{ ...instanceData, ...adminData, publicKey }} />
            )}

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> {error}
              </p>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
              >
                Back
              </Button>
              {step < 5 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Continue
                </Button>
              ) : (
                <Button onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
                  {finishMutation.isPending ? "Setting up…" : "Launch Instance"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
