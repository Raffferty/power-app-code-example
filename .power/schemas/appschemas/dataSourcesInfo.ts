/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "cr9b0_catalogueitems": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr9b0_catalogueitemid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr9b0_internalorders": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr9b0_internalorderid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr9b0_studentses": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr9b0_studentsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "roles": {
    "tableId": "",
    "version": "",
    "primaryKey": "roleid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "sendnotification": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {}
  }
};
