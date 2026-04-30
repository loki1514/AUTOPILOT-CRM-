import { useLeadContacts } from "@/hooks/useLeadContacts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Linkedin, Mail, Phone, Copy } from "lucide-react";
import { toast } from "sonner";
import { EnrichLeadButton } from "./EnrichLeadButton";

export function DecisionMakersTab({ leadId }: { leadId: string }) {
  const { data: contacts = [], isLoading } = useLeadContacts(leadId);

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading…</div>;

  if (!contacts.length) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold">No decision makers yet</h3>
        <p className="text-sm text-muted-foreground">Run enrichment to discover the leadership team (CEO, CXO, Heads of Admin/Operations) at this company via Apollo.</p>
        <div className="flex justify-center"><EnrichLeadButton leadId={leadId} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
              #{c.priority_rank}
            </div>
            <Avatar className="h-12 w-12">
              {c.photo_url && <AvatarImage src={c.photo_url} alt={c.full_name} />}
              <AvatarFallback>{c.full_name.split(" ").map(s => s[0]).slice(0, 2).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{c.full_name}</h4>
                {c.seniority && <Badge variant="secondary" className="text-[10px]">{c.seniority}</Badge>}
                {c.email_status === "verified" && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border-0">verified email</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{c.title}</p>
              {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
              <div className="flex gap-3 mt-3 flex-wrap">
                {c.linkedin_url && (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {c.email && (
                  <button
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    onClick={() => { navigator.clipboard.writeText(c.email!); toast.success("Email copied"); }}
                  >
                    <Mail className="h-3.5 w-3.5" /> {c.email} <Copy className="h-3 w-3" />
                  </button>
                )}
                {c.phone && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}