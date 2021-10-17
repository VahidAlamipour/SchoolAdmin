import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DecimalPipe } from "@angular/common";

import { SdkService } from "src/app/services/sdk.service";
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: "app-plagiarism-checker",
  templateUrl: "./plagiarism-checker.component.html",
  styleUrls: ["../../permissions.component.css", "./plagiarism-checker.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class PlagiarismCheckerComponent implements OnInit {
  constructor(
    private sdk: SdkService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private decimalPipe: DecimalPipe
  ) {}

  public institutionForm: FormGroup;

  //Usage message
  public usageMessage: string;
  public usageRatio: number;
  private totalPages: number;
  private pagesUsedCount: number;

  //Remaining pages message
  public message: string;
  private contactEmail: string;
  private pagesLeftCount: number;

  ngOnInit() {
    this.institutionForm = this.formBuilder.group({
      isInactive: [false]
    });

    this.totalPages = 0;
    this.pagesUsedCount = 0;
    this.GetSettings();
  }

  private GetSettings(): void {
    this.sdk.client.getPermission()
    .then((data) => {
      console.log(data);

      if (data){
        this.institutionForm.value.isInactive = true;

        // this.pagesUsedCount = data.PageCount;
        // this.totalPages = data.MaxPageCount;

        this.setUsageMessage();
        this.setMessage();
      }
    });
  }

  private setUsageMessage(): void {
    this.usageRatio = 100;
    if (this.totalPages != 0){
      this.usageRatio = (this.pagesUsedCount / this.totalPages) * 100;
    }
    
    this.usageMessage = ` <p>
                            Total Usage (All Institutions): 
                            <span class="plagiarism-checker-text-usage">${this.decimalPipe.transform(
                              this.pagesUsedCount
                            )}</span>
                            /
                            ${this.decimalPipe.transform(this.totalPages)}
                            pages
                          </p>`;
  }

  private setMessage(): void {
    this.contactEmail = "contact@beed.world";
    this.pagesLeftCount = this.totalPages - this.pagesUsedCount;

    this.message = `<span>
                      You have ${this.decimalPipe.transform(
                        this.pagesLeftCount
                      )} pages left.
                      Contact BeED <a class="plagiarism-checker-text-email" href="mailto:${
                        this.contactEmail
                      }">${this.contactEmail}</a> to top up now.
                    </span>`;
    // this.message = `<p>
    //                   You have ${this.decimalPipe.transform(this.pagesLeftCount)} pages left.
    //                   Contact BeED <u>${this.contactEmail}</u> to top up now.
    //                 </p>`;
  }

  public onSubmitFormDetails(value: any){

  }
}
