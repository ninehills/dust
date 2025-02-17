import { auth_user, personalWorkspace } from "@app/lib/auth";
import { DustAPI } from "@app/lib/dust_api";
import { App, Clone, Dataset, User } from "@app/lib/models";
import { new_id } from "@app/lib/utils";
import withLogging from "@app/logger/withlogging";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  let [authRes, appUser] = await Promise.all([
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

  if (!appUser) {
    res.status(404).end();
    return;
  }

  let [app] = await Promise.all([
    App.findOne({
      where: {
        userId: appUser.id,
        sId: req.query.sId,
      },
    }),
  ]);

  if (!app) {
    res.status(404).end();
    return;
  }

  let [datasets] = await Promise.all([
    Dataset.findAll({
      where: {
        userId: appUser.id,
        appId: app.id,
      },
      order: [["updatedAt", "DESC"]],
    }),
  ]);

  switch (req.method) {
    case "POST":
      // We want the user to not be anonymous as `canReadApp` can return `true` if the app is public
      // but we must only accept logged in users (as they have to have a user id).
      if (auth.isAnonymous()) {
        res.status(401).end();
        return;
      }
      if (!auth.canReadApp(app)) {
        res.status(404).end();
        return;
      }

      if (
        !req.body ||
        !(typeof req.body.name == "string") ||
        !(typeof req.body.description == "string") ||
        !["public", "private", "unlisted"].includes(req.body.visibility)
      ) {
        res.status(400).end();
        return;
      }

      const project = await DustAPI.cloneProject(app.dustAPIProjectId);
      if (project.isErr()) {
        res.status(500).end();
        break;
      }

      let description = req.body.description ? req.body.description : null;
      let uId = new_id();

      let authOwnerRes = await personalWorkspace(auth.dbUser());
      if (authOwnerRes.isErr()) {
        res.status(authOwnerRes.error.status_code).end();
        return;
      }
      let authOwner = authOwnerRes.value;

      let [cloned] = await Promise.all([
        App.create({
          uId,
          sId: uId.slice(0, 10),
          name: req.body.name,
          description,
          visibility: req.body.visibility,
          dustAPIProjectId: project.value.project.project_id.toString(),
          savedSpecification: app.savedSpecification,
          userId: auth.user().id,
          workspaceId: authOwner.id,
        }),
      ]);

      await Promise.all(
        datasets.map((d) => {
          return Dataset.create({
            name: d.name,
            description: d.description,
            appId: cloned.id,
            userId: auth.user().id,
            workspaceId: authOwner.id,
          });
        })
      );

      await Clone.create({
        fromId: app.id,
        toId: cloned.id,
      });

      res.redirect(`/${auth.user().username}/a/${cloned.sId}`);
      return;

    default:
      res.status(405).end();
      return;
  }
}

export default withLogging(handler);
