import { Op, literal, Transaction } from "sequelize";
import { sequelize } from "../db";
import { keyBy, flatten } from "lodash";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

import config from "../config";

import { GenericController, ReqUser, IPageQuery } from "../crud";
import {
  IPermission,
  IPlagiarismFeature,
  IUser,
  ISchool,
} from "../../sdk/interfaces";

import { RoleRepository } from "../repositories/role";
import { Messages } from "../repositories/messages";

const roleRepo = new RoleRepository();
export class BeedError extends Error {
  public readonly code: number;

  public constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export default class PermissionsCRUD extends GenericController<IPermission> {
  public resource = "/permissions";
  public entity = "permission";
  private debugToken =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjVjMjUxZTZiMWU5MDI2MjE1ZDc5ZTZkMjRkZTUxOTBlIiwidHlwIjoiSldUIn0.eyJuYmYiOjE2MjA2MTI4NzMsImV4cCI6MTYyNTc5Njg3MywiaXNzIjoiaHR0cHM6Ly90ZXN0LWF1dGguYmVlZC53b3JsZCIsImF1ZCI6WyJodHRwczovL3Rlc3QtYXV0aC5iZWVkLndvcmxkL3Jlc291cmNlcyIsImJlZWRvc19hdXRoX2FwaSJdLCJjbGllbnRfaWQiOiJiZWVkb3NfYXV0aF9jbGllbnQiLCJzdWIiOiI4NDIiLCJhdXRoX3RpbWUiOjE2MjA2MTI4NzIsImlkcCI6ImxvY2FsIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiI4NDIiLCJuYW1lIjoiY2hpYW5taWNoYWVsQGZhaXJ2aWV3LmVkdS5teSIsImVtYWlsIjoiY2hpYW5taWNoYWVsQGZhaXJ2aWV3LmVkdS5teSIsImZhbWlseV9uYW1lIjoiQ2hpYW4iLCJnaXZlbl9uYW1lIjoiTWljaGFlbCIsInNjb3BlIjpbIm9wZW5pZCIsImJlZWRvc19hdXRoX2FwaSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.TnqEFpqS-CDVeCCoIo77gW9bwi_IFpbCQ0M6AKG-sWKqe_-CMIrxgXO2fHF0rS5vnDkyL7TZN0Y6YghC0Xb8cB8uxWHZPMknjenbfa_TGt4mYq0UvJ3HedHRALB-rFbbSLESDyT63GCXgFkPXInyg5HiGBnvYH48JNGIhpr1Ldo8iAiaCgNHdlqfCyBkBBJVrnGi3oyudQHOF-lDXkiHrPLzVQpHSDjuaSvmSSNQCtqJUSq4DA1AoYAKLHJQ7AGT9BS66DiOsXfRaptH9oxkGBtkVTgSHP53rKo3s0utzwX4OP0NChfPP_gpptoXknKf4S60QyKxdBHRTjfglTJSBA";





  // KIV feature: Uncomment the below update function for download document feature [DO NOT DELETE]
  // public async update(id: number, data: IPermission, me: ReqUser, query, transaction: Transaction, session): Promise<void> {
  //   const branchId =
  //         me && me.school ? me.school.branchId : -99;
    
  //   await sequelize.query(`UPDATE school_core_v3.branch 
  //   SET download_status = ${data.downloadDocument ? 1 : 0} WHERE id = ${branchId}`,
  //     { type: sequelize.QueryTypes.UPDATE, transaction });

  //   //#region plagiarism
  //   let authorizationToken = this.debugToken;
  //   if (!config.get("auth:fake")) {
  //     authorizationToken = session.passport.user.access_token;
  //   }

  //   const serverAPIResponseRI = await axios({
  //     method: "PUT",
  //     data: data.plagiarism,
  //     url:
  //       config.get("api:user:baseUrl") +
  //       config.get("api:user:account") +
  //       "/features/plagiarism",
  //     headers: {
  //       Authorization: `Bearer ${authorizationToken}`,
  //     },
  //   });
  //   const aa = serverAPIResponseRI.data;
  // }

  // KIV feature: Comment the below update function and use the above update function for download document feature
  // Note: The below update function exclude download document feature
  public async update(id: number, data: IPermission, me: ReqUser, query, transaction: Transaction, session): Promise<void> {
    //#region plagiarism
    let authorizationToken = this.debugToken;
    if (!config.get("auth:fake")) {
      authorizationToken = session.passport.user.access_token;
    }

    const serverAPIResponseRI = await axios({
      method: "PUT",
      data: data.plagiarism,
      url:
        config.get("api:user:baseUrl") +
        config.get("api:user:account") +
        "/features/plagiarism",
      headers: {
        Authorization: `Bearer ${authorizationToken}`,
      },
    });
    const aa = serverAPIResponseRI.data;
  }

  public extra(): void {
    this.router.use(
      async (
        req: Request,
        _res: Response,
        next: NextFunction
      ): Promise<void> => {
        const user: ReqUser = req.user;

        if (!user.access.isSuperAdmin && !user.access.branchesId.length) {
          throw new Error("Access only for account admins");
        } else {
          next();
        }
      }
    );
    this.router.get(
      "/all",
      async (req: Request, res: Response): Promise<void> => {
        const branchId =
          req.user && req.user.school ? req.user.school.branchId : -99;

        let downloadStatusResult = 0;
        const downloadStatus = await sequelize.query(`SELECT download_status 
        FROM school_core_v3.branch WHERE id = ${branchId} LIMIT 1`,
          { type: sequelize.QueryTypes.SELECT });

        if (downloadStatus && downloadStatus.length) {
          downloadStatusResult = downloadStatus[0].download_status;
        }
        //#region Plagiarism
        //LMS branchId is LMS accountId > Journey LMSId in Accounts

        // const branchId = -99; //test

        let authorizationToken = this.debugToken;
        if (!config.get("auth:fake")) {
          authorizationToken = req.session.passport.user.access_token;
        }

        const serverAPIResponseRI = await axios({
          method: "GET",
          url:
            config.get("api:user:baseUrl") +
            config.get("api:user:account") +
            "/features/plagiarism/" +
            branchId,
          headers: {
            Authorization: `Bearer ${authorizationToken}`,
          },
        });

        const mapper = (input): Partial<IPlagiarismFeature> => ({
          id: input.Id,
          accountId: input.AccountId,
          featureId: input.FeatureId,
          lmsId: input.LMSId,
          isActive: input.IsActive,
          pageCount: input.PageCount,
          maxPageCount: input.MaxPageCount,
          quotaBalance: input.QuotaBalance
        });
        //#endregion

        res.json({
          downloadStatus:downloadStatusResult,
          // rows: serverAPIResponseRI.data
          rows: serverAPIResponseRI.data
            ? mapper(serverAPIResponseRI.data)
            : null,
        });

      }
    );

    this.router.put(
      "/plagiarism",
      async (req: Request, res: Response): Promise<void> => {
        //LMS branchId is LMS accountId > Journey LMSId in Accounts
        const data = req.body;

        let authorizationToken = this.debugToken;
        if (!config.get("auth:fake")) {
          authorizationToken = req.session.passport.user.access_token;
        }

        const serverAPIResponseRI = await axios({
          method: "PUT",
          data: data,
          url:
            config.get("api:user:baseUrl") +
            config.get("api:user:account") +
            "/features/plagiarism",
          headers: {
            Authorization: `Bearer ${authorizationToken}`,
          },
        });

        res.json({
          rows: serverAPIResponseRI.data,
        });
      }
    );
  }
}
