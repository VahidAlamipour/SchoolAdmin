import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { SdkService } from 'src/app/services/sdk.service';
import { AcademicYear } from 'src/app/models/interfaces.model';
import { ICity, ICountry, ISchool } from '../../../../../../../sdk/interfaces';

@Injectable()
export class InstitutionsModalService {
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

  public async uploadInstitution(institutionData: ISchool): Promise<number> {
    return await this.sdk.client.newSchool(institutionData);
  }

  public async uploadInstitutionWithSchedule(
    institutionData: ISchool,
    academicYear: AcademicYear
  ): Promise<any> {
    const institutionId = await this.sdk.client.newSchool(institutionData);
    return await this.sdk.client.newAcademicYear(
      { schoolId: institutionId },
      academicYear
    );
  }
}
