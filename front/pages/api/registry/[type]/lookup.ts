import { User, DataSource, Key } from "@app/lib/models";
import { Op } from "sequelize";
import withLogging from "@app/logger/withlogging";
import { NextApiRequest, NextApiResponse } from "next";
import { Authenticator } from "@app/lib/auth";

const { DUST_REGISTRY_SECRET } = process.env;

type LookupDataSourceResponseBody = {
  project_id: number;
  data_source_id: string;
};

/**
 * Notes about the registry lookup service:
 *
 * For DataSources, we could proxy and modify on the fly the config before going to core and replace
 * username/workspace by the internal dust project id but we'll need the same logic for code blocks
 * to execute other dust apps and won't be able to modify on the fly the code, and will need to do
 * it over API from core to front there, so we might as well handle this consistently.
 *
 * But that means we need to pass through the Dust UserId (in the future workspace) as header when
 * going to core so that we can retrieve it here and check that the user has indeed access to the
 * DataSource to prevent someone trying to access a DataSource by tweaking its API call config
 *
 * all of this creates an entanglement between core and front but only through this registry lookup
 * service.
 *
 * Note: there is also a problem with private DataSources on public apps, the use of the registry
 * here will prevent leaking them.
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LookupDataSourceResponseBody>
): Promise<void> {
  if (!req.headers.authorization) {
    res.status(401).end();
    return;
  }

  let parse = req.headers.authorization.match(/Bearer ([a-zA-Z0-9]+)/);
  if (!parse || !parse[1]) {
    res.status(401).end();
    return;
  }
  let secret = parse[1];

  if (secret !== DUST_REGISTRY_SECRET) {
    res.status(401).end();
    return;
  }

  if (!req.headers["x-dust-user-id"]) {
    res.status(400).end();
    return;
  }

  let dustUserId = parseInt(req.headers["x-dust-user-id"] as string);
  if (isNaN(dustUserId)) {
    res.status(400).end();
    return;
  }

  let authUser = await User.findOne({
    where: {
      id: dustUserId,
    },
  });
  let auth = new Authenticator(authUser);

  if (auth.isAnonymous()) {
    res.status(401).end();
    return;
  }

  switch (req.method) {
    case "GET":
      switch (req.query.type) {
        case "data_sources":
          if (
            typeof req.query.username !== "string" ||
            typeof req.query.data_source_id !== "string"
          ) {
            res.status(400).end();
            return;
          }

          let dataSourceUser = await User.findOne({
            where: {
              username: req.query.username,
            },
          });

          if (!dataSourceUser) {
            res.status(401).end();
            return;
          }

          let dataSource = await DataSource.findOne({
            where: {
              userId: dataSourceUser.id,
              name: req.query.data_source_id,
            },
          });

          if (!dataSource) {
            res.status(404).end();
            return;
          }

          if (!auth.canReadDataSource(dataSource)) {
            res.status(404).end();
            return;
          }

          res.status(200).json({
            project_id: parseInt(dataSource.dustAPIProjectId),
            data_source_id: req.query.data_source_id,
          });
          return;

        default:
          res.status(405).end();
          return;
      }
      return;

    default:
      res.status(405).end();
      return;
  }
}

export default withLogging(handler);
