import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/features/settings";

export const metadata = { title: "Profile and settings" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile and settings"
        description="Update your details. Changes to permitted fields are sent to the admins for review."
      />
      <SettingsTabs />
    </>
  );
}
