import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { DtAuthBrandingPanel, DtAuthMobileLogo } from '../../shared/ui/auth/auth-branding-panel';

@Component({
  selector: 'app-check-email-page',
  imports: [RouterLink, DtAuthBrandingPanel, DtAuthMobileLogo, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-email-page.html',
})
export class CheckEmailPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly email = this.route.snapshot.queryParamMap.get('email');
}
