import AppLayout from "@app/components/AppLayout";
import MainTab from "@app/components/profile/MainTab";
import { Button } from "@app/components/Button";
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { classNames } from "@app/lib/utils";
import { auth_user } from "@app/lib/auth";

const { URL, GA_TRACKING_ID = null } = process.env;

export default function DataSourcesView({
  authUser,
  owner,
  readOnly,
  dataSources,
  ga_tracking_id,
}) {
  return (
    <AppLayout ga_tracking_id={ga_tracking_id}>
      <div className="flex flex-col">
        <div className="mt-2 flex flex-initial">
          <MainTab currentTab="DataSources" owner={owner} readOnly={readOnly} />
        </div>
        <div className="">
          <div className="mx-auto mt-8 divide-y divide-gray-200 px-6 sm:max-w-2xl lg:max-w-4xl">
            <div>
              {readOnly ? null : (
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto"></div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link
                      href={`/${owner.username}/data_sources/new`}
                    >
                      <Button>
                        <PlusIcon className="-ml-1 mr-1 h-5 w-5" />
                        New DataSource
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-8 overflow-hidden">
                <ul role="list" className="">
                  {dataSources.map((ds) => (
                    <li key={ds.name} className="px-2">
                      <div className="py-4">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/${owner.username}/ds/${ds.name}`}
                            className="block"
                          >
                            <p className="truncate text-base font-bold text-violet-600">
                              {ds.name}
                            </p>
                          </Link>
                          <div className="ml-2 flex flex-shrink-0">
                            <p
                              className={classNames(
                                "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                ds.visibility == "public"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              )}
                            >
                              {ds.visibility}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-700">
                              {ds.description}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-300 sm:mt-0">
                            <p></p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {dataSources.length == 0 ? (
                    <div className="mt-10 flex flex-col items-center justify-center text-sm text-gray-500">
                      {readOnly ? (
                        <>
                          <p>
                            Welcome to Dust DataSources 🔎{" "}
                            <span className="font-bold">{owner.username}</span>{" "}
                            has not created any data source yet 🙃
                          </p>
                          <p className="mt-2">
                            Sign-in to create your own data source.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>Welcome to Dust DataSources 🔎</p>
                          <p className="mt-2">
                            Data sources let you upload documents to perform
                            semantic searches on them (
                            <span className="rounded-md bg-gray-200 px-1 py-0.5 font-bold">
                              data_source
                            </span>{" "}
                            block).
                          </p>
                        </>
                      )}
                    </div>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export async function getServerSideProps(context) {
  let authRes = await auth_user(context.req, context.res);
  if (authRes.isErr()) {
    return { noFound: true };
  }
  let auth = authRes.value;

  let readOnly =
    auth.isAnonymous() || context.query.user !== auth.user().username;

  const [dataSourcesRes] = await Promise.all([
    fetch(`${URL}/api/data_sources/${context.query.user}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: context.req.headers.cookie,
      },
    }),
  ]);

  if (dataSourcesRes.status === 404) {
    return { notFound: true };
  }

  const [dataSources] = await Promise.all([dataSourcesRes.json()]);

  return {
    props: {
      session: auth.session(),
      authUser: auth.isAnonymous() ? null : auth.user(),
      owner: { username: context.query.user },
      readOnly,
      dataSources: dataSources.dataSources,
      ga_tracking_id: GA_TRACKING_ID,
    },
  };
}
