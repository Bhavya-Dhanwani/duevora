import { PageHeader } from "../../../../app/components/common";
import { EmptyState } from "../../../../app/components/common";
import { HiOutlineInbox } from "react-icons/hi2";

export default function DeliveryChallanListPage() {
  return (
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
      <PageHeader
        title="Delivery Challans"
        subtitle="Manage your delivery challans"
      />
      <EmptyState
        title="No items yet"
        description="Create your first item to get started."
      />
    </div>
  );
}
