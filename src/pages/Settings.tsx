import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/atmosphere/PageHeader";
import { ModuleToggleList } from "@/components/settings/ModuleToggleList";
import { PeopleRolesCard } from "@/components/settings/PeopleRolesCard";

export default function Settings() {
  return (
    <MainLayout>
      <PageHeader
        eyebrow="Workspace · Settings"
        title="Settings"
        subtitle="Workspace-wide configuration. Changes apply to every user."
      />
      <div className="space-y-6">
        <PeopleRolesCard />
        <ModuleToggleList />
      </div>
    </MainLayout>
  );
}