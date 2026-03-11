import CollectSubnav from "../../../components/CollectSubnav";
import FormsTemplatesTable from "../../../components/FormsTemplatesTable";
import FormsSubmissionsTable from "../../../components/FormsSubmissionsTable";

type SearchParams = Promise<{ view?: string }>;

export default async function CollectFormsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const view = params?.view === "submissions" ? "submissions" : "templates";

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Forms</h1>

          <div className="mt-4">
            <CollectSubnav
              items={[
                { label: "Templates", href: "/collect/forms" },
                { label: "Submissions", href: "/collect/forms?view=submissions" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            className="w-60 rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
          />

          <button className="rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-2xl leading-none text-[#4b0a06] hover:bg-[#fdf6f5]">
            +
          </button>
        </div>
      </div>

      {view === "templates" ? (
        <FormsTemplatesTable />
      ) : (
        <FormsSubmissionsTable />
      )}
    </>
  );
}