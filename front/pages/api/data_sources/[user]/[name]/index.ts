import { auth_user } from "@app/lib/auth";
import { DustAPI } from "@app/lib/dust_api";
import { DataSource, User } from "@app/lib/models";
import withLogging from "@app/logger/withlogging";
import { DataSourceType } from "@app/types/data_source";
import { NextApiRequest, NextApiResponse } from "next";

export type GetDataSourceResponseBody = {
  dataSource: DataSourceType;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetDataSourceResponseBody>
): Promise<void> {
  let [authRes, dataSourceUser] = await Promise.all([
    auth_user(req, res),
    User.findOne({
      where: {
        username: req.query.user,
      },
    }),
  ]);

  if (authRes.isErr()) {
    res.status(authRes.error.status_code).end();
    return;
  }
  let auth = authRes.value;

  if (!dataSourceUser) {
    res.status(404).end();
    return;
  }

  let dataSource = await DataSource.findOne({
    where: {
      userId: dataSourceUser.id,
      name: req.query.name,
    },
  });

  if (!dataSource) {
    res.status(404).end();
    return;
  }

  switch (req.method) {
    case "GET":
      if (!auth.canReadDataSource(dataSource)) {
        res.status(404).end();
        return;
      }

      res.status(200).json({
        dataSource: {
          name: dataSource.name,
          description: dataSource.description,
          visibility: dataSource.visibility,
          config: dataSource.config,
          dustAPIProjectId: dataSource.dustAPIProjectId,
        },
      });
      return;

    case "POST":
      if (!auth.canEditDataSource(dataSource)) {
        res.status(401).end();
        return;
      }

      if (
        !req.body ||
        !(typeof req.body.description == "string") ||
        !["public", "private"].includes(req.body.visibility)
      ) {
        res.status(400).end();
        return;
      }

      let description = req.body.description ? req.body.description : null;

      await dataSource.update({
        description,
        visibility: req.body.visibility,
      });

      res.redirect(`/${dataSourceUser.username}/ds/${dataSource.name}`);
      return;

    case "DELETE":
      if (!auth.canEditDataSource(dataSource)) {
        res.status(401).end();
        return;
      }

      const dustDataSource = await DustAPI.deleteDataSource(
        dataSource.dustAPIProjectId,
        dataSource.name
      );

      if (dustDataSource.isErr()) {
        res.status(500).end();
        return;
      }

      await dataSource.destroy();

      res.status(200).end();
      return;

    default:
      res.status(405).end();
      return;
  }
}

export default withLogging(handler);
