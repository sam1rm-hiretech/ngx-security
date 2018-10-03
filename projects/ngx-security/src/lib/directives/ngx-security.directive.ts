import { merge, Observable, of, Subscription } from 'rxjs';
import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgxSecurityService } from '../services/ngx-security.service';
import { every, first, map, tap } from 'rxjs/operators';

@Directive({ selector: '[secuBaseSecurity]' })
export class BaseSecurityDirective implements OnInit, OnDestroy {
  private stateSubscription: Subscription;
  protected elseTemplateRef: TemplateRef<any>;
  protected expectedValue: boolean;

  constructor(
    protected security: NgxSecurityService,
    protected templateRef: TemplateRef<any>,
    protected viewContainer: ViewContainerRef
  ) {
    this.expectedValue = true;
    this.postConstruct();
  }

  protected postConstruct(): void {}

  ngOnInit(): void {
    if (this.security)
      this.stateSubscription = this.security.state$.pipe(
        tap(() => { this.handleStateChange(); })
      ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.stateSubscription)
      this.stateSubscription.unsubscribe();
  }


  private handleStateChange(): void {
    this.isAuthorized().pipe(
      map(hasPerm => {
        this.viewContainer.clear();

        if (hasPerm)
          this.viewContainer.createEmbeddedView(this.templateRef);

        else if (this.elseTemplateRef)
          this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      })
    ).subscribe();
  }


  protected isAuthorized(): Observable<boolean> {
    return of(false);
  }


  protected testEvery(fn: (name: string) => Observable<boolean>, input: string | string[], expected: boolean): Observable<boolean> {
    let obs$: Observable<boolean>[] = [];
    if (Array.isArray(input)) {
      obs$.push(...input.map(r => fn(r)));
    }
    else if (input) {
      obs$.push(fn(input));
    }
    else {
      obs$.push(of(false));
    }

    return merge(...obs$).pipe(
      every(r => r === expected)
    );
  }
}



@Directive({ selector: '[secuIsAuthenticated]' })
export class IsAuthenticatedDirective extends BaseSecurityDirective {
  isAuthorized(): Observable<boolean> {
    return this.security.isAuthenticated().pipe(
      map ((auth: boolean) => auth === this.expectedValue)
    );
  }
}


@Directive({ selector: '[secuIsAnonymous]' })
export class IsAnonymousDirective extends IsAuthenticatedDirective {
  protected postConstruct(): void {
    this.expectedValue = false;
    super.postConstruct();
  }
}





@Directive({ selector: '[secuHasRoles]' })
export class HasRolesDirective extends BaseSecurityDirective {
  @Input('secuHasRoles') input: string | string[];

  @Input('secuHasRolesElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.hasRole(n)), this.input, true);
  }
}


@Directive({ selector: '[secuHasNotRoles]' })
export class HasNotRolesDirective extends BaseSecurityDirective {
  @Input('secuHasNotRoles') input: string | string[];

  @Input('secuHasNotRolesElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.hasRole(n)), this.input, false);
  }
}


@Directive({ selector: '[secuHasAnyRoles]' })
export class HasAnyRolesDirective extends BaseSecurityDirective {
  @Input('secuHasAnyRoles') input: string[];

  @Input('secuHasAnyRolesElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    if (this.input) {
      let obs$ = this.input.map(r => this.security.hasRole(r));
      return merge(...obs$).pipe(
        first(r => r, false)
      );
    }

    return of(false);
  }
}



@Directive({ selector: '[secuIsMemberOf]' })
export class IsMemberOfDirective extends BaseSecurityDirective {
  @Input('secuIsMemberOf') input: string | string[];

  @Input('secuIsMemberOfElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.isMemberOf(n)), this.input, true);
  }
}


@Directive({ selector: '[secuIsNotMemberOf]' })
export class IsNotMemberOfDirective extends BaseSecurityDirective {
  @Input('secuIsNotMemberOf') input: string | string[];

  @Input('secuIsNotMemberOfElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.isMemberOf(n)), this.input, false);
  }
}




@Directive({ selector: '[secuHasPermissions]' })
export class HasPermissionsDirective extends BaseSecurityDirective {
  @Input('secuHasPermissions') input: string | string[];

  @Input('secuHasPermissionsElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.hasPermission(n)), this.input, true);
  }
}


@Directive({ selector: '[secuHasNotPermissions]' })
export class HasNotPermissionsDirective extends BaseSecurityDirective {
  @Input('secuHasNotPermissions') input: string | string[];

  @Input('secuHasNotPermissionsElse') set elseBlock(elseBlock: TemplateRef<any>) {
    this.elseTemplateRef = elseBlock;
  }

  isAuthorized(): Observable<boolean> {
    return this.testEvery((n => this.security.hasPermission(n)), this.input, true);
  }
}