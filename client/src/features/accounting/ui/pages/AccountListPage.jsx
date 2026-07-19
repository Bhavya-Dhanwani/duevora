import { PageHeader } from "../../../../app/components/common";
import { EmptyState } from "../../../../app/components/common";
import { HiOutlineInbox } from "react-icons/hi2";

export default function AccountListPage() {
  return (
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your chart of accounts"
      />
      <EmptyState
        title="No items yet"
        description="Create your first item to get started."
      />
    </div>
  );
}
