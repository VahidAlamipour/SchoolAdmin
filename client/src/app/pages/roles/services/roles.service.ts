import { Injectable } from '@angular/core';

import { SdkService } from 'src/app/services/sdk.service';

@Injectable()
export class RolesService {
  constructor(private sdk: SdkService) {}
}
