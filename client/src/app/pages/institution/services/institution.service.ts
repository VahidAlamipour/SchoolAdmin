import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { SdkService } from 'src/app/services/sdk.service';
import {
  ICity,
  ICountry,
  ISchool,
  IAdministrator
} from '../../../../../../sdk/interfaces';
import { IPageResponse } from '../../../../../../sdk/sdk';
import { AcademicYear } from 'src/app/models/interfaces.model';

@Injectable()
export class InstitutionService {
  public editMode = false;

  public allCountries: ICountry[];
  public allCities: ICity[];

  constructor(private sdk: SdkService) {}

  public loadCountries(): void {
    if (!this.allCountries || this.allCountries.length === 0) {
      this.sdk.client
        .getCountries({ limit: -1 })
        .then(countries => (this.allCountries = countries.list));
    }
  }

  public loadCities(countryId: number): void {
    this.sdk.client
      .getCities({ limit: -1, countryId: countryId })
      .then(cities => (this.allCities = cities.list));
  }

  public loadInstitutionAdmins(
    institutionId: number
  ): Promise<IPageResponse<IAdministrator>> {
    return this.sdk.client.getAdmins({ schoolId: institutionId });
  }

  public uploadInstitutionData(
    institutionId: number,
    institutionData: ISchool
  ): Promise<any> {
    return this.sdk.client.updateSchool(institutionId, institutionData);
  }

  public uploadAcademicYearData(
    institutionId: number,
    academicYear: AcademicYear
  ): Promise<any> {
    return this.sdk.client.newAcademicYear(
      { schoolId: institutionId },
      academicYear
    );
  }

  public updateAcademicYearData(
    institutionId: number,
    academicYear: any
  ): Promise<any> {
    return this.sdk.client.updateAcademicYear(
      { schoolId: institutionId },
      { ...academicYear, id: academicYear.yearId }
    );
  }
}
