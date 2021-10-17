import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { SdkService } from 'src/app/services/sdk.service';
import { ISchool } from '../../../../../../sdk/interfaces';
import { IPageResponse } from '../../../../../../sdk/sdk';

@Injectable()
export class RolesPreloadService implements Resolve<any> {
  constructor(private sdk: SdkService) {}

  async resolve(ars: ActivatedRouteSnapshot): Promise<any> {
    return await Promise.resolve({
      userRoles: await this.sdk.client.getUserRoles(ars.params.id),
      allInstitutions: await this.sdk.client
        .getSchools({ limit: -1 })
        .then((data: IPageResponse<ISchool>) => data.list)
    });
  }
}
