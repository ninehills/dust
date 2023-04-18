import { auth_api_user } from "@app/lib/auth";
import { DustAPI } from "@app/lib/dust_api";
import { APIError } from "@app/lib/error";
import { DataSource, Provider, User } from "@app/lib/models";
import { credentialsFromProviders } from "@app/lib/providers";
import withLogging from "@app/logger/withlogging";
import { DataSourceType } from "@app/types/data_source";
import { DocumentType } from "@app/types/document";
import { NextApiRequest, NextApiResponse } from "next";

export type GetDocumentResponseBody = {
  document: DocumentType;
};
export type DeleteDocumentResponseBody = {
  document: {
    document_id: string;
  };
};
export type UpsertDocumentResponseBody = {
  document: DocumentType;
  data_source: DataSourceType;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | GetDocumentResponseBody
    | DeleteDocumentResponseBody
    | UpsertDocumentResponseBody
    | APIError
  >
): Promise<void> {
  let [authRes, dataSourceOwner] = await Promise.all([
    auth_api_user(req),
    User.findOne({
      where: {
        username: req.query.user,
      },
    }),
  ]);

  if (authRes.isErr()) {
    const err = authRes.error;
    return res.status(err.status_code).json(err.api_error);
  }
  const auth = authRes.value;

  if (!dataSourceOwner) {
    res.status(404).json({
      error: {
        type: "user_not_found",
        message: "The user you're trying to query was not found.",
      },
    });
    return;
  }

  let dataSource = await DataSource.findOne({
    where: {
      userId: dataSourceOwner.id,
      name: req.query.name,
    },
  });

  if (!dataSource) {
    res.status(404).json({
      error: {
        type: "data_source_not_found",
        message: "The data source you requested was not found.",
      },
    });
    return;
  }

  switch (req.method) {
    case "GET":
      if (!auth.canReadDataSource(dataSource)) {
        res.status(404).json({
          error: {
            type: "data_source_not_found",
            message: "The data source you requested was not found.",
          },
        });
        return;
      }

      const docRes = await DustAPI.getDataSourceDocument(
        dataSource.dustAPIProjectId,
        dataSource.name,
        req.query.documentId as string
      );

      if (docRes.isErr()) {
        if (docRes.error.code === 404) {
          res.status(404).json({
            error: {
              type: "data_source_document_not_found",
              message:
                "The data source document you're trying to retrieve was not found.",
            },
          });
        } else {
          res.status(400).json({
            error: {
              type: "data_source_error",
              message:
                "There was an error retrieving the data source document.",
              data_source_error: docRes.error,
            },
          });

          return;
        }
      } else {
        res.status(200).json({
          document: docRes.value.document,
        });
        return;
      }

    case "POST":
      if (!auth.canEditDataSource(dataSource)) {
        res.status(401).json({
          error: {
            type: "data_source_user_mismatch_error",
            message: "Only the data source you own can be managed by API.",
          },
        });
        return;
      }

      let [providers] = await Promise.all([
        Provider.findAll({
          where: {
            userId: auth.user().id,
          },
        }),
      ]);

      if (!req.body || !(typeof req.body.text == "string")) {
        res.status(400).json({
          error: {
            type: "invalid_request_error",
            message: "Invalid request body, `text` (string) is required.",
          },
        });
        return;
      }

      let timestamp = null;
      if (req.body.timestamp) {
        if (typeof req.body.timestamp !== "number") {
          res.status(400).json({
            error: {
              type: "invalid_request_error",
              message:
                "Invalid request body, `timestamp` if provided must be a number.",
            },
          });
          return;
        }
        timestamp = req.body.timestamp;
      }

      let tags = [];
      if (req.body.tags) {
        if (!Array.isArray(req.body.tags)) {
          res.status(400).json({
            error: {
              type: "invalid_request_error",
              message:
                "Invalid request body, `tags` if provided must be an array of strings.",
            },
          });
          return;
        }
        tags = req.body.tags;
      }

      // Enforce FreePlan limit: 32 documents per DataSource.
      if (auth.user().username !== "spolu") {
        const documents = await DustAPI.getDataSourceDocuments(
          dataSource.dustAPIProjectId,
          dataSource.name,
          1,
          0
        );

        if (documents.isErr()) {
          res.status(400).json({
            error: {
              type: "data_source_error",
              message: "There was an error retrieving the data source.",
              data_source_error: documents.error,
            },
          });
          return;
        }
        if (documents.value.total >= 512) {
          res.status(401).json({
            error: {
              type: "data_source_quota_error",
              message:
                "Data sources are limited to 512 documents.",
            },
          });
          return;
        }
      }

      // Enforce Text limit: 10 MB per document.
      if (req.body.text.length > 10 * 1024 * 1024) {
        res.status(401).json({
          error: {
            type: "data_source_quota_error",
            message:
              "Data sources document upload size is limited to 10MB.",
          },
        });
        return;
      }

      let credentials = credentialsFromProviders(providers);

      // Create document with the Dust internal API.
      const upsertRes = await DustAPI.upsertDataSourceDocument(
        dataSource.dustAPIProjectId,
        dataSource.name,
        {
          documentId: req.query.documentId as string,
          timestamp,
          tags,
          text: req.body.text,
          credentials,
        }
      );

      if (upsertRes.isErr()) {
        res.status(500).json({
          error: {
            type: "internal_server_error",
            message: "There was an error upserting the document.",
            data_source_error: upsertRes.error,
          },
        });
        return;
      }

      res.status(200).json({
        document: upsertRes.value.document,
        data_source: {
          name: dataSource.name,
          description: dataSource.description,
          visibility: dataSource.visibility,
          config: dataSource.config,
          dustAPIProjectId: dataSource.dustAPIProjectId,
        },
      });
      return;

    case "DELETE":
      if (!auth.canEditDataSource(dataSource)) {
        res.status(401).json({
          error: {
            type: "data_source_user_mismatch_error",
            message: "Only the data source you own can be managed by API.",
          },
        });
        return;
      }

      const delRes = await DustAPI.deleteDataSourceDocument(
        dataSource.dustAPIProjectId,
        dataSource.name,
        req.query.documentId as string
      );

      if (delRes.isErr()) {
        res.status(500).json({
          error: {
            type: "internal_server_error",
            message: "There was an error deleting the document.",
            data_source_error: delRes.error,
          },
        });
        return;
      }

      res.status(200).json({
        document: {
          document_id: req.query.documentId as string,
        },
      });
      return;

    default:
      res.status(405).json({
        error: {
          type: "method_not_supported_error",
          message:
            "The method passed is not supported, GET, POST or DELETE are expected.",
        },
      });
      return;
  }
}

export default withLogging(handler);
